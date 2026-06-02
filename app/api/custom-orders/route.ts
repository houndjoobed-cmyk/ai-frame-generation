import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { createCustomOrderSchema } from "@/lib/validations"
import { randomUUID } from "crypto"
import { sendCustomOrderSubmittedEmail, sendAdminNewOrderEmail } from "@/lib/mail"

// GET: Retrieve custom orders for the logged-in user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour voir vos commandes." },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()
    const { data: orders, error } = await supabase
      .from("custom_orders")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database query error loading custom orders:", error)
      return NextResponse.json(
        { success: false, error: "Impossible de récupérer vos commandes." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orders: orders || []
    })
  } catch (error) {
    console.error("Custom orders GET route error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}

// POST: Submit a new custom frame order
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour commander un cadre." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = createCustomOrderSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Données invalides"
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

    const { eventName, eventDate, eventType, description, referenceImageUrl, referenceImageBase64, budget } = parsed.data
    const supabase = createAdminClient()
    let finalReferenceImageUrl = referenceImageUrl || null

    // Upload base64 image if present
    if (referenceImageBase64) {
      try {
        // Ensure bucket exists
        try {
          const { data: buckets } = await supabase.storage.listBuckets()
          if (!buckets?.some((b) => b.name === "shares")) {
            await supabase.storage.createBucket("shares", {
              public: true,
              fileSizeLimit: 10485760
            })
          }
        } catch (e) {
          console.warn("Bucket check failed inside custom orders", e)
        }

        const base64Data = referenceImageBase64.replace(/^data:image\/\w+;base64,/, "")
        const buffer = Buffer.from(base64Data, "base64")
        const fileName = `inspiration/${session.user.id}/${randomUUID()}.png`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("shares")
          .upload(fileName, buffer, {
            contentType: "image/png",
            cacheControl: "3600",
            upsert: true
          })

        if (uploadError) {
          console.error("Failed to upload custom order inspiration image:", uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("shares")
            .getPublicUrl(fileName)
          finalReferenceImageUrl = publicUrl
        }
      } catch (uploadErr) {
        console.error("Error during custom order image upload:", uploadErr)
      }
    }

    const { data: order, error } = await supabase
      .from("custom_orders")
      .insert({
        user_id: session.user.id,
        event_name: eventName,
        event_date: eventDate || null,
        event_type: eventType,
        description,
        reference_image_url: finalReferenceImageUrl,
        budget: budget || null,
        status: "pending"
      })
      .select()
      .single()

    if (error) {
      console.error("Database insert error custom order:", error)
      return NextResponse.json(
        { success: false, error: "Erreur lors de l'enregistrement de la commande." },
        { status: 500 }
      )
    }

    // Insert a notification trigger for the user
    try {
      await supabase.from("notifications").insert({
        user_id: session.user.id,
        title: "Commande reçue !",
        message: `Votre commande pour "${eventName}" a été enregistrée avec succès. Notre graphiste l'examinera sous peu.`,
        category: "system",
        is_read: false
      })

      // Fetch all administrator profiles to notify them
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .or("role.eq.admin,role.eq.super_admin")

      if (adminProfiles && adminProfiles.length > 0) {
        // Insert database notifications for all admins
        const adminNotifications = adminProfiles.map((admin) => ({
          user_id: admin.user_id,
          title: "Nouvelle commande sur-mesure",
          message: `Le client "${session.user.name || session.user.email || 'Anonyme'}" a soumis une commande pour "${eventName}".`,
          category: "system",
          is_read: false
        }))
        await supabase.from("notifications").insert(adminNotifications)

        // Send email alerts to all admins
        for (const admin of adminProfiles) {
          if (admin.email) {
            await sendAdminNewOrderEmail(
              admin.email,
              session.user.name || session.user.email || "Un client",
              eventName,
              order.id
            )
          }
        }
      }

      // Send email confirmation to the client
      if (session.user.email) {
        await sendCustomOrderSubmittedEmail(
          session.user.email,
          session.user.name || null,
          eventName
        )
      }
    } catch (notifErr) {
      console.error("Failed to process notifications for custom order:", notifErr)
    }

    return NextResponse.json({
      success: true,
      order
    }, { status: 201 })
  } catch (error) {
    console.error("Custom orders POST route error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}
