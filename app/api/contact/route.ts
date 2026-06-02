import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/mail"
import { rateLimit } from "@/lib/rate-limit"
import { contactSchema } from "@/lib/validations"

export async function POST(request: Request) {
  try {
    // Rate Limiting: max 3 contact submissions per 15 minutes per IP
    const limitResult = await rateLimit("contact:submit", 3, 15 * 60 * 1000)
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: "Trop de messages envoyés. Veuillez réessayer dans 15 minutes." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Données de formulaire invalides."
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

    const { name, email, message } = parsed.data

    const supportEmail = "supporteventframes@gmail.com"

    const subject = `[Contact] Nouveau message de ${name}`
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0c1b33; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #ffffff;">Event Frames</h1>
          <p style="margin: 5px 0 0 0; color: #9efd38; font-size: 14px;">Nouveau Message de Contact</p>
        </div>
        <div style="padding: 20px; color: #333333; line-height: 1.6;">
          <p><strong>Nom de l'expéditeur :</strong> ${name}</p>
          <p><strong>Adresse E-mail :</strong> <a href="mailto:${email}" style="color: #ea9010; text-decoration: none;">${email}</a></p>
          <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          <p><strong>Message :</strong></p>
          <blockquote style="margin: 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #ea9010; border-radius: 4px; font-style: italic;">
            ${message.replace(/\n/g, "<br />")}
          </blockquote>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #71717a;">
          Cet e-mail a été envoyé automatiquement depuis le formulaire de contact de Event Frames.
        </div>
      </div>
    `

    await sendEmail({
      to: supportEmail,
      subject,
      html,
    })

    return NextResponse.json({ success: true, message: "Votre message a été envoyé avec succès !" })

  } catch (error) {
    console.error("Error in contact form endpoint:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue lors de l'envoi." },
      { status: 500 }
    )
  }
}
