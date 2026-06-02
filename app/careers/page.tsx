"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react"

const jobs = [
  {
    id: 1,
    title: "Développeur Full-Stack React / Next.js",
    department: "Technologie",
    location: "Télétravail / Cotonou",
    type: "Temps plein",
  },
  {
    id: 2,
    title: "Designer UI/UX Senior",
    department: "Produit",
    location: "Télétravail / Paris",
    type: "Temps plein",
  },
  {
    id: 3,
    title: "Développeur Backend / IA Engineer",
    department: "Technologie",
    location: "Hybride / Cotonou",
    type: "Temps plein",
  },
]

export default function CareersPage() {
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
            Rejoignez <span className="bg-linear-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">Event Frames</span>
          </h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
            Nous construisons le futur de la création visuelle événementielle. Venez créer avec nous !
          </p>
        </motion.div>

        {/* Section Careers Intro */}
        <div className="mb-16 text-center text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
          <p className="mb-4">
            Chez Event Frames, nous croyons au travail flexible, à l'autonomie et à l'excellence créative. Nous cherchons constamment des talents passionnés par la technologie, le design et l'expérience utilisateur.
          </p>
          <p>
            Découvrez nos postes ouverts ci-dessous ou envoyez-nous une candidature spontanée à <span className="font-semibold text-rose-500">supporteventframes@gmail.com</span>.
          </p>
        </div>

        {/* Jobs List */}
        <h2 className="text-2xl font-bold mb-6 text-center md:text-left">Postes Disponibles</h2>
        <div className="space-y-4">
          {jobs.map((job, idx) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <a
                href={`mailto:supporteventframes@gmail.com?subject=${encodeURIComponent(`Candidature - ${job.title}`)}`}
                className="block"
              >
                <Card className="bg-card/60 backdrop-blur-md border border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-lg cursor-pointer group">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors duration-300">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-rose-500 md:self-center">
                      Postuler
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
