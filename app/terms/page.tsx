"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"

export default function TermsPage() {
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
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Dernière mise à jour : 26 Mai 2026</p>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mt-6">1. Acceptation des Conditions</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              En accédant et en utilisant le site Event Frames, vous acceptez d'être lié par les présentes conditions d'utilisation, toutes les lois et réglementations applicables, et vous acceptez que vous êtes responsable du respect des lois locales applicables.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mt-6">2. Droits de Propriété Intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              Les cadres créés par vous à l'aide de nos modèles ou générés par l'IA restent votre propriété. Cependant, les éléments graphiques préexistants de la plateforme, les modèles officiels, et le code source du site restent la propriété exclusive d'Event Frames.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mt-6">3. Utilisation des Services IA</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              Les crédits d'intelligence artificielle alloués à votre compte sont personnels. Vous vous engagez à ne pas tenter de saturer ou d'attaquer nos serveurs d'IA par des méthodes automatisées (bots, scrapers). Les contenus générés doivent respecter les lois en vigueur.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mt-6">4. Modifications des Services</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              Event Frames se réserve le droit de modifier, suspendre ou interrompre, temporairement ou définitivement, tout ou partie de ses services sans préavis.
            </p>
          </section>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
