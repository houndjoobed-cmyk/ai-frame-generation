"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"

export default function CookiesPage() {
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
            Politique relative aux Cookies
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Dernière mise à jour : 26 Mai 2026</p>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mt-6">1. Qu'est-ce qu'un Cookie ?</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              Un cookie est un petit fichier texte stocké sur votre ordinateur ou appareil mobile lorsque vous visitez un site internet. Il permet de retenir vos actions et préférences pour que vous n'ayez pas à les saisir à chaque fois.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mt-6">2. Types de Cookies Utilisés</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              Nous utilisons principalement des cookies essentiels et fonctionnels :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground leading-relaxed font-light space-y-2">
              <li><strong>Cookies de session (NextAuth)</strong> : Essentiels pour vous maintenir connecté à votre compte tout au long de votre visite.</li>
              <li><strong>Cookies de langue</strong> : Pour mémoriser votre préférence linguistique (Français / Anglais).</li>
              <li><strong>Cookies d'analyse (Vercel Analytics)</strong> : Données anonymes pour nous aider à comprendre les performances de notre site.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mt-6">3. Comment Contrôler les Cookies</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              Vous pouvez contrôler et/ou supprimer des cookies comme vous le souhaitez en modifiant les réglages de votre navigateur web. Cependant, si vous désactivez nos cookies essentiels, certaines parties du site (comme la connexion) risquent de ne plus fonctionner correctement.
            </p>
          </section>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
