"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, MapPin, Send } from "lucide-react"
import { toast } from "sonner"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setIsSending(true)

    // Simulate sending email
    setTimeout(() => {
      setIsSending(false)
      toast.success("Votre message a été envoyé avec succès ! Nous vous répondrons bientôt.")
      setName("")
      setEmail("")
      setMessage("")
    }, 1000)
  }

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
            Contactez-<span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">nous</span>
          </h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
            Une question, une suggestion ou besoin d'aide ? Envoyez-nous un message !
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-2 space-y-6"
          >
            <div className="p-8 rounded-3xl bg-muted/20 border border-border/40 space-y-6 h-full flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-4">Nos Coordonnées</h2>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</p>
                  <p className="text-sm font-medium">support@eventframes.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Téléphone</p>
                  <p className="text-sm font-medium">+229 01 00 00 00 00</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Adresse</p>
                  <p className="text-sm font-medium">Cotonou, Bénin</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-3"
          >
            <Card className="bg-card border border-border/60 rounded-3xl p-8 shadow-xl">
              <CardContent className="p-0">
                <form onSubmit={handleSend} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom Complet</Label>
                    <Input
                      id="name"
                      placeholder="Votre nom"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Votre Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Dites-nous tout..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-600/95 shadow-md" disabled={isSending}>
                    {isSending ? "Envoi en cours..." : "Envoyer le message"}
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
