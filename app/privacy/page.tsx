"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-20 px-4 max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="prose prose-zinc dark:prose-invert max-w-none"
        >
          <h1 className="text-4xl font-extrabold tracking-tight mb-8">
            Politique de Confidentialité
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Dernière mise à jour : 26 Mai 2026</p>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mt-6">1. Collecte des Données</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              Nous collectons des informations lorsque vous vous inscrivez sur notre site, vous vous connectez à votre compte, ou utilisez nos services de création de cadres. Les informations collectées incluent votre nom, votre adresse e-mail et vos photos chargées pour la création de cadres.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mt-6">2. Utilisation des Informations</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              Toutes les informations que nous recueillons auprès de vous peuvent être utilisées pour :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground leading-relaxed font-light space-y-2">
              <li>Personnaliser votre expérience et répondre à vos besoins individuels.</li>
              <li>Fournir et améliorer nos services (notamment l'éditeur de canevas et la génération IA).</li>
              <li>Améliorer le service client et vos besoins de prise en charge.</li>
              <li>Vous contacter par e-mail concernant des transactions ou des alertes importantes.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mt-6">3. Protection des Données</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              Nous mettons en œuvre une variété de mesures de sécurité pour préserver la sécurité de vos informations personnelles. Vos photos et données d'édition sont stockées de manière sécurisée via des services Cloud de pointe (Supabase) utilisant le cryptage SSL en transit et au repos.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mt-6">4. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              Nos cookies améliorent l'accès à notre site et identifient les visiteurs réguliers. Cependant, cette utilisation des cookies n'est en aucune façon liée à des informations personnelles identifiables sur notre site.
            </p>
          </section>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
