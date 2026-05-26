"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { Sparkles, Heart, Users, Shield } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-20 px-4 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
            À Propos de <span className="bg-linear-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">Event Frames</span>
          </h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
            Nous donnons vie à vos souvenirs en concevant des cadres photo personnalisés et mémorables pour tous vos événements.
          </p>
        </motion.div>

        {/* Section Mission */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-card border border-border/60 shadow-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Notre Mission</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              Permettre à chacun de créer des visuels magnifiques en quelques clics grâce à des technologies modernes et des designs de cadres haut de gamme, adaptés à chaque occasion spéciale.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 rounded-3xl bg-card border border-border/60 shadow-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
              <Heart className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Nos Valeurs</h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              La créativité, la simplicité et la qualité. Nous croyons que chaque instant partagé mérite d'être mis en valeur avec un design exceptionnel et un respect absolu de votre vie privée.
            </p>
          </motion.div>
        </div>

        {/* Section Histoire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-8 rounded-3xl bg-muted/20 border border-border/40 mb-16"
        >
          <h2 className="text-2xl font-bold mb-4">Notre Histoire</h2>
          <p className="text-muted-foreground leading-relaxed font-light mb-4">
            Fondée en 2026, Event Frames est née d'un constat simple : la création de cadres personnalisés pour les anniversaires, mariages ou soirées d'entreprise était trop complexe ou nécessitait des compétences de graphiste avancées.
          </p>
          <p className="text-muted-foreground leading-relaxed font-light">
            En mariant un éditeur de canevas interactif intuitif (basé sur HTML5 et Fabric.js) et l'assistance de la génération d'images par IA, nous offrons une plateforme tout-en-un accessible à tous, des particuliers aux organisateurs d'événements professionnels.
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
