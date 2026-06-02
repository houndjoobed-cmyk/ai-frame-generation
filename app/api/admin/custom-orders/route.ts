import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { updateCustomOrderStatusSchema } from "@/lib/validations"
import { randomUUID } from "crypto"
import { sendCustomOrderQuoteSetEmail, sendCustomOrderCompletedEmail } from "@/lib/mail"

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single()
  return profile?.role === "admin" || profile?.role === "super_admin"
}

// GET: Retrieve all custom orders for admin review
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const supabase = createAdminClient()
    const { data: orders, error } = await supabase
      .from("custom_orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error fetching admin custom orders:", error)
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 })
    }

    // Fetch payments to map transaction references (e.g. kkiapay transaction IDs)
    const { data: payments } = await supabase
      .from("payments")
      .select("provider_reference, metadata")
      .eq("status", "completed")
      .eq("provider", "kkiapay")

    const paymentMap = new Map<string, string>()
    if (payments) {
      for (const p of payments) {
        try {
          const meta = typeof p.metadata === "string" ? JSON.parse(p.metadata) : p.metadata
          const customOrderId = meta?.custom_order_id
          if (customOrderId && p.provider_reference) {
            paymentMap.set(customOrderId, p.provider_reference)
          }
        } catch (e) {
          console.warn("Failed to parse payment metadata for log record:", e)
        }
      }
    }

    // Enrich orders with user profiles (names/emails) from profiles table
    const userIds = (orders || []).map((o: { user_id: string }) => o.user_id)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds)

    const profileMap = new Map((profiles || []).map((p: { user_id: string; display_name: string | null; email: string | null }) => [p.user_id, p]))

    const enrichedOrders = (orders || []).map((o: Record<string, unknown>) => {
      const userId = o.user_id as string
      const orderId = o.id as string
      const profile = profileMap.get(userId)
      return {
        ...o,
        userName: profile?.display_name || "Utilisateur sans nom",
        userEmail: profile?.email || "Inconnu",
        payment_reference: paymentMap.get(orderId) || null,
      }
    })

    return NextResponse.json({ success: true, orders: enrichedOrders })
  } catch (error) {
    console.error("Admin custom orders GET error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

// PUT: Update custom order status, designer notes, or attach completed frame
export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateCustomOrderStatusSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Données invalides"
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { orderId, status, designerNotes, completedFrameUrl, completedFrameBase64, budget } = parsed.data
    const supabase = createAdminClient()
    let finalCompletedFrameUrl = completedFrameUrl || null

    // Upload base64 completed frame if provided
    if (completedFrameBase64) {
      try {
        // Ensure shares bucket exists
        try {
          const { data: buckets } = await supabase.storage.listBuckets()
          if (!buckets?.some((b) => b.name === "shares")) {
            await supabase.storage.createBucket("shares", {
              public: true,
              fileSizeLimit: 10485760
            })
          }
        } catch (e) {
          console.warn("Bucket check failed inside admin custom orders", e)
        }

        const base64Data = completedFrameBase64.replace(/^data:image\/\w+;base64,/, "")
        const buffer = Buffer.from(base64Data, "base64")
        const fileName = `completed/${orderId}/${randomUUID()}.png`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("shares")
          .upload(fileName, buffer, {
            contentType: "image/png",
            cacheControl: "3600",
            upsert: true
          })

        if (uploadError) {
          console.error("Failed to upload completed frame from admin:", uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("shares")
            .getPublicUrl(fileName)
          finalCompletedFrameUrl = publicUrl
        }
      } catch (uploadErr) {
        console.error("Error during admin completed frame upload:", uploadErr)
      }
    }

    // 1. Fetch current order info to notify user correctly
    const { data: currentOrder, error: fetchError } = await supabase
      .from("custom_orders")
      .select("user_id, event_name, status, budget")
      .eq("id", orderId)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    }

    // 2. Perform update
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString()
    }
    if (designerNotes !== undefined) updatePayload.designer_notes = designerNotes
    if (finalCompletedFrameUrl !== null || completedFrameUrl !== undefined) {
      updatePayload.completed_frame_url = finalCompletedFrameUrl
    }
    if (budget !== undefined) {
      updatePayload.budget = budget
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("custom_orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .single()

    if (updateError) {
      console.error("Database error updating custom order:", updateError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    // 3. Notify user of status change
    if (currentOrder.status !== status) {
      let statusFrench = "En attente"
      if (status === "awaiting_payment") statusFrench = "En attente de paiement"
      if (status === "in_progress") statusFrench = "En cours de traitement"
      if (status === "completed") statusFrench = "Terminée"
      if (status === "cancelled") statusFrench = "Annulée"

      let message = `Votre commande pour "${currentOrder.event_name}" est passée au statut : ${statusFrench}.`
      if (status === "awaiting_payment") {
        const newBudget = budget !== undefined ? budget : (currentOrder.budget || 0)
        message = `Le devis pour votre commande "${currentOrder.event_name}" a été fixé à ${newBudget} XOF. Vous pouvez maintenant procéder au paiement depuis votre tableau de bord.`
      }
      if (status === "completed") {
        message = `Bonne nouvelle ! Votre cadre pour "${currentOrder.event_name}" est prêt. Vous pouvez maintenant le voir et l'utiliser.`
      }

      try {
        await supabase.from("notifications").insert({
          user_id: currentOrder.user_id,
          title: `Commande mise à jour : ${statusFrench}`,
          message,
          category: "system",
          is_read: false
        })

        // Fetch customer profile to send email alerts
        const { data: customerProfile } = await supabase
          .from("profiles")
          .select("display_name, email")
          .eq("user_id", currentOrder.user_id)
          .single()

        if (customerProfile?.email) {
          if (status === "awaiting_payment") {
            const finalBudget = budget !== undefined ? budget : (currentOrder.budget || 0)
            await sendCustomOrderQuoteSetEmail(
              customerProfile.email,
              customerProfile.display_name || null,
              currentOrder.event_name,
              finalBudget
            )
          } else if (status === "completed") {
            const downloadUrl = finalCompletedFrameUrl || updatedOrder.completed_frame_url || ""
            await sendCustomOrderCompletedEmail(
              customerProfile.email,
              customerProfile.display_name || null,
              currentOrder.event_name,
              downloadUrl
            )
          }
        }
      } catch (notifErr) {
        console.error("Failed to process notifications for custom order update:", notifErr)
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error("Admin custom orders PUT error:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
