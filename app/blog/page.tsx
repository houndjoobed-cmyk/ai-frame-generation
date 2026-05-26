"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, ArrowRight } from "lucide-react"
import Link from "next/link"

const blogPosts = [
  {
    id: 1,
    title: "Comment concevoir le cadre parfait pour un mariage",
    excerpt: "Découvrez nos conseils et astuces de design pour créer un cadre photo élégant et intemporel pour votre grand jour.",
    date: "15 Mai 2026",
    author: "Sophie Dubois",
    category: "Design",
  },
  {
    id: 2,
    title: "Top 5 des tendances de cadres pour anniversaires en 2026",
    excerpt: "Des styles néon rétro aux designs minimalistes modernes, découvrez ce qui cartonne cette année pour les fêtes d'anniversaire.",
    date: "10 Mai 2026",
    author: "Marc Lemaire",
    category: "Tendances",
  },
  {
    id: 3,
    title: "Comment utiliser l'IA d'Event Frames pour générer des idées",
    excerpt: "Un guide étape par étape pour maîtriser notre assistant de génération par intelligence artificielle et booster votre créativité.",
    date: "01 Mai 2026",
    author: "Alexandre Sy",
    category: "Tutoriels",
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-20 px-4 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
            Notre <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
            Retrouvez nos derniers articles de blog, astuces de design, tutoriels et nouveautés.
          </p>
        </motion.div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {blogPosts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="h-full bg-card/60 backdrop-blur-md border border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-xl flex flex-col justify-between overflow-hidden group">
                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      {post.category}
                    </span>
                    <h2 className="text-xl font-bold mt-4 mb-2 group-hover:text-primary transition-colors duration-300 leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground text-sm font-light leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {post.author}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
