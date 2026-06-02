import { createAdminClient } from "@/lib/supabase/admin"

interface SendMailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendMailParams) {
  const brevoApiKey = process.env.BREVO_API_KEY
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@eventframes.com"
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

export async function sendCustomOrderSubmittedEmail(email: string, name: string | null, eventName: string) {
  const subject = "Event Frames - Demande de cadre reçue !"
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"
  const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ea580c; text-align: center;">Demande de cadre enregistrée</h2>
      <p>${greeting}</p>
      <p>Votre demande de cadre sur-mesure pour l'événement <strong>"${eventName}"</strong> a bien été transmise à notre graphiste professionnel.</p>
      <p>Celui-ci va l'étudier rapidement afin de vous proposer un devis adapté à votre demande.</p>
      <p>Vous recevrez un e-mail dès que le devis aura été fixé. Vous pourrez également suivre l'avancement depuis votre espace client :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${nextAuthUrl}/dashboard/custom-orders" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Suivre ma demande</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Merci pour votre confiance,<br />L'équipe Event Frames</p>
    </div>
  `

  const text = `
    ${greeting}\n\n
    Votre demande de cadre sur-mesure pour l'événement "${eventName}" a bien été enregistrée.\n
    Notre graphiste l'examinera sous peu afin de vous faire une proposition de devis.\n
    Vous pouvez suivre son avancement à cette adresse : ${nextAuthUrl}/dashboard/custom-orders\n\n
    Merci pour votre confiance,\n
    L'équipe Event Frames
  `

  await sendEmail({ to: email, subject, html, text })
}

export async function sendAdminNewOrderEmail(email: string, clientName: string, eventName: string, orderId: string) {
  const subject = `[ADMIN] Nouvelle commande sur-mesure : ${eventName}`
  const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e3a8a; text-align: center;">Nouvelle Demande Client</h2>
      <p>Bonjour Admin,</p>
      <p>Le client <strong>${clientName}</strong> vient de soumettre une nouvelle demande de cadre photo personnalisé.</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Événement :</strong> ${eventName}</p>
        <p style="margin: 0;"><strong>Lien Commande ID :</strong> <code style="background: #e2e8f0; padding: 2px 4px; border-radius: 4px;">${orderId}</code></p>
      </div>
      <p>Veuillez vous rendre sur l'interface d'administration pour étudier le cahier des charges, proposer un devis (budget) ou entrer en contact avec le client :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${nextAuthUrl}/admin/custom-orders" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Gérer les commandes</a>
      </div>
    </div>
  `

  const text = `
    Bonjour Admin,\n\n
    Le client ${clientName} a créé une demande de cadre photo personnalisé pour l'événement : "${eventName}".\n
    Veuillez définir un devis en vous connectant à l'interface d'administration : ${nextAuthUrl}/admin/custom-orders
  `

  await sendEmail({ to: email, subject, html, text })
}

export async function sendCustomOrderQuoteSetEmail(email: string, name: string | null, eventName: string, budget: number) {
  const subject = "Event Frames - Devis disponible pour votre cadre"
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"
  const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #10b981; text-align: center;">Votre devis est prêt !</h2>
      <p>${greeting}</p>
      <p>Bonne nouvelle, notre graphiste a étudié votre cahier des charges pour l'événement <strong>"${eventName}"</strong> et a fixé son devis.</p>
      <div style="text-align: center; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <span style="font-size: 14px; color: #065f46; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Montant du Devis</span>
        <h1 style="margin: 5px 0 0 0; color: #047857; font-size: 32px;">${budget} XOF</h1>
      </div>
      <p>Pour lancer la création du cadre, veuillez procéder au règlement du devis en ligne depuis votre tableau de bord en cliquant sur le bouton ci-dessous :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${nextAuthUrl}/dashboard/custom-orders" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Régler mon devis</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">L'équipe Event Frames</p>
    </div>
  `

  const text = `
    ${greeting}\n\n
    Le devis pour la création de votre cadre pour "${eventName}" a été fixé à ${budget} XOF.\n
    Veuillez le payer depuis votre tableau de bord afin de commencer le travail : ${nextAuthUrl}/dashboard/custom-orders\n\n
    Cordialement,\n
    L'équipe Event Frames
  `

  await sendEmail({ to: email, subject, html, text })
}

export async function sendCustomOrderPaidEmail(email: string, name: string | null, eventName: string, amount: number) {
  const subject = "Event Frames - Paiement validé & Lancement de la conception"
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"
  const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ea580c; text-align: center;">Merci pour votre paiement !</h2>
      <p>${greeting}</p>
      <p>Votre paiement de <strong>${amount} XOF</strong> pour le cadre de l'événement <strong>"${eventName}"</strong> a bien été reçu et validé.</p>
      <p>Notre graphiste se met immédiatement au travail pour concevoir votre cadre personnalisé conforme à vos consignes.</p>
      <p>Vous recevrez un e-mail avec un lien de téléchargement dès que le visuel final sera prêt.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${nextAuthUrl}/dashboard/custom-orders" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Voir ma commande</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">L'équipe Event Frames</p>
    </div>
  `

  const text = `
    ${greeting}\n\n
    Votre paiement de ${amount} XOF pour la commande "${eventName}" a été validé. Notre graphiste commence le travail de conception. Vous serez prévenu dès qu'il sera prêt !\n
    Suivi de commande : ${nextAuthUrl}/dashboard/custom-orders
  `

  await sendEmail({ to: email, subject, html, text })
}

export async function sendAdminOrderPaidEmail(email: string, clientName: string, eventName: string, amount: number, orderId: string) {
  const subject = `[ADMIN] Commande payée et à concevoir : ${eventName}`
  const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e3a8a; text-align: center;">Paiement Reçu - Commande Prête</h2>
      <p>Bonjour Admin,</p>
      <p>Le client <strong>${clientName}</strong> a payé son devis de <strong>${amount} XOF</strong> pour le projet <strong>"${eventName}"</strong>.</p>
      <p>La commande est désormais <strong>En cours de réalisation (in_progress)</strong>. Vous pouvez créer le fichier PNG final et le téléverser sur l'interface d'administration :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${nextAuthUrl}/admin/custom-orders" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accéder au projet</a>
      </div>
    </div>
  `

  const text = `
    Bonjour Admin,\n\n
    Le client ${clientName} a payé son devis de ${amount} XOF pour l'événement : "${eventName}".\n
    La commande doit être réalisée. Téléversez le fichier final ici : ${nextAuthUrl}/admin/custom-orders
  `

  await sendEmail({ to: email, subject, html, text })
}

export async function sendCustomOrderCompletedEmail(email: string, name: string | null, eventName: string, downloadUrl: string) {
  const subject = "Event Frames - Votre cadre sur-mesure est prêt !"
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ea580c; text-align: center;">Votre cadre est disponible ! 🎉</h2>
      <p>${greeting}</p>
      <p>Notre graphiste a terminé la création de votre cadre personnalisé pour l'événement <strong>"${eventName}"</strong>.</p>
      <p>Vous pouvez dès à présent le visualiser et le télécharger en cliquant sur le bouton ci-dessous :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${downloadUrl}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Télécharger mon cadre (PNG)</a>
      </div>
      <p style="font-size: 14px; color: #64748b; text-align: center;">Merci d'avoir choisi Event Frames pour embellir vos événements !</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">L'équipe Event Frames</p>
    </div>
  `

  const text = `
    ${greeting}\n\n
    Votre cadre pour l'événement "${eventName}" est prêt ! Vous pouvez le télécharger directement à l'adresse suivante :\n\n
    ${downloadUrl}\n\n
    Merci pour votre confiance,\n
    L'équipe Event Frames
  `

  await sendEmail({ to: email, subject, html, text })
}
