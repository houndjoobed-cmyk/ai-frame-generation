import { createAdminClient } from "@/lib/supabase/admin"

interface SendMailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendMailParams) {
  const brevoApiKey = process.env.BREVO_API_KEY
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || "obeddoria@gmail.com"
  const resendApiKey = process.env.RESEND_API_KEY

  if (brevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "Event Frames",
            email: brevoSenderEmail,
          },
          to: [
            {
              email: to,
            },
          ],
          subject: subject,
          htmlContent: html,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        console.error("Brevo API error:", errData)
      } else {
        console.log(`Email successfully sent via Brevo to ${to}`)
        return
      }
    } catch (e) {
      console.error("Failed to send email via Brevo:", e)
    }
  } else if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Event Frames <onboarding@resend.dev>",
          to: [to],
          subject: subject,
          html: html,
          text: text,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        console.error("Resend API error:", errData)
      } else {
        console.log(`Email successfully sent via Resend to ${to}`)
        return
      }
    } catch (e) {
      console.error("Failed to send email via Resend:", e)
    }
  }

  // Fallback console log for local development or if RESEND_API_KEY is not defined
  console.log("\n==================================================")
  console.log("✉️  [MOCK EMAIL SENT]  ✉️")
  console.log(`To:      ${to}`)
  console.log(`Subject: ${subject}`)
  console.log("--------------------------------------------------")
  console.log(`Text Content:\n${text || "See HTML below"}`)
  console.log("--------------------------------------------------")
  console.log("Link extracted from HTML:")
  const linkMatch = html.match(/href="([^"]+)"/)
  if (linkMatch && linkMatch[1]) {
    console.log(`👉 Reset/Verify Link: ${linkMatch[1]}`)
  } else {
    console.log("No link found in HTML.")
  }
  console.log("==================================================\n")
}

export async function sendVerificationEmail(email: string, name: string | null, token: string) {
  const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const verifyLink = `${nextAuthUrl}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  const subject = "Event Frames - Vérifiez votre adresse e-mail"
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ea580c; text-align: center;">Bienvenue sur Event Frames !</h2>
      <p>${greeting}</p>
      <p>Merci de vous être inscrit sur <strong>Event Frames</strong>. Pour activer votre compte et commencer à créer de magnifiques cadres photo, veuillez vérifier votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyLink}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activer mon compte</a>
      </div>
      <p style="font-size: 14px; color: #64748b;">Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
      <p style="font-size: 14px; word-break: break-all; color: #2563eb;"><a href="${verifyLink}">${verifyLink}</a></p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Ce lien expirera dans 24 heures. Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet e-mail.</p>
    </div>
  `

  const text = `
    Bonjour,\n\n
    Merci de vous être inscrit sur Event Frames. Pour activer votre compte, veuillez vérifier votre adresse e-mail en visitant ce lien :\n\n
    ${verifyLink}\n\n
    Ce lien expirera dans 24 heures. Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet e-mail.
  `

  await sendEmail({ to: email, subject, html, text })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const resetLink = `${nextAuthUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`

  const subject = "Event Frames - Réinitialisation de votre mot de passe"

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ea580c; text-align: center;">Réinitialisation du mot de passe</h2>
      <p>Bonjour,</p>
      <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte sur <strong>Event Frames</strong>. Veuillez cliquer sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Réinitialiser mon mot de passe</a>
      </div>
      <p style="font-size: 14px; color: #64748b;">Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
      <p style="font-size: 14px; word-break: break-all; color: #2563eb;"><a href="${resetLink}">${resetLink}</a></p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Ce lien expirera dans 1 heure. Si vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet e-mail en toute sécurité.</p>
    </div>
  `

  const text = `
    Bonjour,\n\n
    Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte sur Event Frames. Veuillez utiliser le lien ci-dessous pour définir un nouveau mot de passe :\n\n
    ${resetLink}\n\n
    Ce lien expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.
  `

  await sendEmail({ to: email, subject, html, text })
}
