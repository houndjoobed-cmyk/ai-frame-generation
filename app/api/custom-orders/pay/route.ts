import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendCustomOrderPaidEmail, sendAdminOrderPaidEmail } from "@/lib/mail"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté." },
        { status: 401 }
      )
    }


    const { orderId, transactionId } = await req.json()

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: "L'ID de transaction est requis." },
        { status: 400 }
      )
    }

    // 1. Verify transaction status with Kkiapay API
    const publicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY
    const privateKey = process.env.KKIAPAY_PRIVATE_KEY
    const secretKey = process.env.KKIAPAY_SECRET_KEY

    if (!publicKey || !privateKey || !secretKey) {
      console.error("Kkiapay credentials not configured in API pay route.")
      return NextResponse.json(
        { success: false, error: "Le service de paiement n'est pas configuré." },
        { status: 500 }
      )
    }

    const isSandbox = privateKey.startsWith("tpk_")
    const baseUrl = isSandbox ? "https://api-sandbox.kkiapay.me" : "https://api.kkiapay.me"
    const kkiapayUrl = `${baseUrl}/api/v1/transactions/status`

    const response = await fetch(kkiapayUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": publicKey,
        "x-private-key": privateKey,
        "x-secret-key": secretKey
      },
      body: JSON.stringify({ transactionId })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Kkiapay API error inside custom orders pay:", errorText)


      return NextResponse.json(
        { success: false, error: "Erreur de communication avec Kkiapay." },
        { status: 502 }
      )
    }

    const data = await response.json()
    
    // Resolve orderId from transaction metadata if not provided in the request
    let finalOrderId = orderId
    if (!finalOrderId) {
      try {
        const rawMetadata = data.state || data.data
        if (rawMetadata) {
          const parsedData = typeof rawMetadata === "string" ? JSON.parse(rawMetadata) : rawMetadata
          finalOrderId = parsedData.orderId
        }
      } catch (e) {
        console.error("Failed to parse orderId from transaction metadata:", e)
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("Kkiapay payment verify for order:", finalOrderId, data)
    }

    if (data.status !== "SUCCESS") {
      console.error(`Custom order payment failed: transaction=${transactionId}, status=${data.status}`)

      return NextResponse.json(
        { success: false, error: `La transaction a échoué. Statut : ${data.status}` },
        { status: 400 }
      )
    }

    if (!finalOrderId) {
      return NextResponse.json(
        { success: false, error: "L'ID de commande est introuvable ou absent de la transaction." },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 2. Fetch the corresponding custom order
    const { data: order, error: orderError } = await supabase
      .from("custom_orders")
      .select("*")
      .eq("id", finalOrderId)
      .single()

    if (orderError || !order) {
      console.error("Custom order not found for payment verification:", orderError)
      return NextResponse.json(
        { success: false, error: "Commande introuvable." },
        { status: 404 }
      )
    }

    // Security check: order must belong to the current user
    if (order.user_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Action non autorisée." },
        { status: 403 }
      )
    }

    // Check if order status is awaiting_payment
    if (order.status !== "awaiting_payment") {
      return NextResponse.json(
        { success: false, error: `La commande n'est pas en attente de paiement (Statut actuel: ${order.status}).` },
        { status: 400 }
      )
    }

    // Validate paid amount (handles minor currency conversion or rounding fluctuations)
    const paidAmount = Number(data.amount)
    const expectedAmount = Number(order.budget)
    if (paidAmount < expectedAmount * 0.99) {
      return NextResponse.json(
        { success: false, error: `Le montant payé (${paidAmount} XOF) est inférieur au montant du devis (${expectedAmount} XOF).` },
        { status: 400 }
      )
    }

    // 3. Update Custom Order status to 'in_progress'
    const { error: updateError } = await supabase
      .from("custom_orders")
      .update({
        status: "in_progress",
        updated_at: new Date().toISOString()
      })
      .eq("id", finalOrderId)

    if (updateError) {
      console.error("Failed to update custom order status after payment:", updateError)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la mise à jour de la commande." },
        { status: 500 }
      )
    }

    // 4. Log transaction in public.payments
    try {
      await supabase
        .from("payments")
        .insert({
          user_id: session.user.id,
          amount: paidAmount,
          currency: data.currency || "XOF",
          provider: "kkiapay",
          provider_reference: transactionId,
          status: "completed",
          description: `Paiement devis - Cadre personnalisé "${order.event_name}"`,
          metadata: {
            custom_order_id: finalOrderId,
            kkiapay_transaction_id: transactionId
          }
        })
    } catch (paymentErr) {
      console.error("Failed to insert payment audit log for custom order:", paymentErr)
      // Non-blocking for the user
    }

    // 5. Send notification to client and administrators
    try {
      await supabase.from("notifications").insert({
        user_id: session.user.id,
        title: "Paiement validé !",
        message: `Votre paiement de ${paidAmount} XOF pour le cadre "${order.event_name}" a été validé. Le graphiste commence le travail.`,
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
          title: "Paiement de commande reçu",
          message: `Le client "${session.user.name || session.user.email || 'Anonyme'}" a réglé son devis de ${paidAmount} XOF pour "${order.event_name}".`,
          category: "system",
          is_read: false
        }))
        await supabase.from("notifications").insert(adminNotifications)

        // Send email alerts to all admins
        for (const admin of adminProfiles) {
          if (admin.email) {
            await sendAdminOrderPaidEmail(
              admin.email,
              session.user.name || session.user.email || "Un client",
              order.event_name,
              paidAmount,
              order.id
            )
          }
        }
      }

      // Send email confirmation to the client
      if (session.user.email) {
        await sendCustomOrderPaidEmail(
          session.user.email,
          session.user.name || null,
          order.event_name,
          paidAmount
        )
      }
    } catch (notifErr) {
      console.error("Failed to process payment notifications:", notifErr)
    }

    return NextResponse.json({ success: true, status: "SUCCESS" })
  } catch (error) {
    console.error("Custom order pay verification route error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}
