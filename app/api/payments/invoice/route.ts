import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { jsPDF } from "jspdf"
import { rateLimit } from "@/lib/rate-limit"

export async function GET(req: Request) {
  try {
    // Rate Limiting: max 15 invoice downloads per 5 mins per IP
    const limitResult = await rateLimit("payments:invoice", 15, 5 * 60 * 1000)
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: "Trop de téléchargements. Veuillez réessayer dans quelques minutes." },
        { status: 429 }
      )
    }

    // 1. Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 2. Parse search parameters
    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get("id")

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 3. Retrieve payment and verify ownership
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*, subscription:user_subscriptions(*)")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found" },
        { status: 404 }
      )
    }

    // IDOR Protection: Ensure user owns this payment
    if (payment.user_id !== session.user.id && session.user.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      )
    }

    // 4. Gather client information
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", payment.user_id)
      .maybeSingle()

    const { data: authUser } = await supabase
      .schema("next_auth")
      .from("users")
      .select("email")
      .eq("id", payment.user_id)
      .maybeSingle()

    const clientName = profile?.display_name || session.user.name || "Client Event Frames"
    const clientEmail = authUser?.email || session.user.email || ""

    // 5. Generate PDF using jsPDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Dimensions: A4 is 210mm x 297mm
    // Margins: 20mm left/right, 20mm top/bottom
    const margin = 20
    const pageWidth = 210
    
    // --- Header Background Block (Dark Blue brand color) ---
    doc.setFillColor(12, 27, 51) // #0C1B33
    doc.rect(0, 0, pageWidth, 45, "F")

    // --- Green accent line ---
    doc.setFillColor(158, 253, 56) // #9efd38 (Brand green)
    doc.rect(0, 45, pageWidth, 2, "F")

    // --- Brand Logo / Title ---
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.text("EVENT FRAMES", margin, 20)
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text("AI Frame Generation Platform", margin, 26)
    doc.text("support@eventframes.com", margin, 32)

    // --- Invoice Title & Status ---
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.text("FACTURE / RECEIPT", pageWidth - margin, 22, { align: "right" })
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    const formattedDate = new Date(payment.created_at).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    doc.text(`Date : ${formattedDate}`, pageWidth - margin, 28, { align: "right" })
    doc.text(`Statut : PAYÉ / SUCCESS`, pageWidth - margin, 34, { align: "right" })

    // --- Reset text color ---
    doc.setTextColor(51, 51, 51) // #333333

    // --- Invoice Details (Bill To / Bill From) ---
    let y = 60
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("FACTURÉ À (BILL TO) :", margin, y)
    doc.text("ÉMIS PAR (BILL FROM) :", pageWidth / 2 + 10, y)

    y += 6
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(clientName, margin, y)
    doc.text("Event Frames Inc.", pageWidth / 2 + 10, y)

    y += 5
    doc.text(clientEmail, margin, y)
    doc.text("Cotonou, Bénin", pageWidth / 2 + 10, y)

    y += 5
    doc.text("https://eventframes.com", pageWidth / 2 + 10, y)

    // Divider
    y += 10
    doc.setDrawColor(220, 220, 220)
    doc.line(margin, y, pageWidth - margin, y)

    // --- Meta Details Row ---
    y += 10
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text("Référence de paiement :", margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(payment.provider_reference || payment.id, margin + 45, y)

    doc.setFont("helvetica", "bold")
    doc.text("Moyen de paiement :", pageWidth / 2 + 10, y)
    doc.setFont("helvetica", "normal")
    doc.text(payment.provider ? payment.provider.toUpperCase() : "KKIAPAY", pageWidth / 2 + 50, y)

    // --- Table Headers ---
    y += 15
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, y, pageWidth - 2 * margin, 8, "F")
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Description", margin + 5, y + 5.5)
    doc.text("Qté", margin + 110, y + 5.5)
    doc.text("Prix Unitaire", margin + 130, y + 5.5)
    doc.text("Total", pageWidth - margin - 5, y + 5.5, { align: "right" })

    // --- Table Row ---
    y += 8
    doc.setFont("helvetica", "normal")
    doc.text(payment.description || "Abonnement Event Frames", margin + 5, y + 6)
    doc.text("1", margin + 112, y + 6)
    const formattedAmount = `${Number(payment.amount).toLocaleString()} ${payment.currency}`
    doc.text(formattedAmount, margin + 130, y + 6)
    doc.text(formattedAmount, pageWidth - margin - 5, y + 6, { align: "right" })

    // Row underline
    y += 10
    doc.line(margin, y, pageWidth - margin, y)

    // --- Total Box ---
    y += 10
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("Montant Total Payé :", pageWidth - margin - 55, y, { align: "right" })
    doc.setFontSize(13)
    doc.setTextColor(234, 144, 16) // Brand orange: #EA9010
    doc.text(formattedAmount, pageWidth - margin - 5, y, { align: "right" })

    // --- Footer Terms ---
    doc.setTextColor(120, 120, 120)
    doc.setFont("helvetica", "italic")
    doc.setFontSize(9)
    doc.text("Cette facture sert de reçu pour votre paiement.", margin, 270)
    doc.text("Pour toute assistance, contactez support@eventframes.com", margin, 275)
    
    doc.setFont("helvetica", "normal")
    doc.text("Merci pour votre confiance !", pageWidth / 2, 282, { align: "center" })

    // Generate buffer
    const pdfBuffer = doc.output("arraybuffer")

    // Return PDF
    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-${payment.provider_reference || payment.id}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating invoice PDF:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
