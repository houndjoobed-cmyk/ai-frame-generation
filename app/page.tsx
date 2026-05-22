"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Upload,
  Download,
  Share2,
  Layers,
  Palette,
  ArrowRight,
  Check,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"
import { LandingPreviewSlider } from "@/components/landing-preview-slider"

export default function HomePage() {
  const { t } = useI18n()

  const features = [
    {
      icon: Upload,
      title: t("feat.upload.title"),
      description: t("feat.upload.desc"),
    },
    {
      icon: Layers,
      title: t("feat.templates.title"),
      description: t("feat.templates.desc"),
    },
    {
      icon: Palette,
      title: t("feat.custom.title"),
      description: t("feat.custom.desc"),
    },
    {
      icon: Download,
      title: t("feat.export.title"),
      description: t("feat.export.desc"),
    },
    {
      icon: Sparkles,
      title: t("feat.ai.title"),
      description: t("feat.ai.desc"),
    },
    {
      icon: Share2,
      title: t("feat.share.title"),
      description: t("feat.share.desc"),
    },
  ]

  const categories = [
    { name: t("cat.birthday"), slug: "birthday", count: 45, color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
    { name: t("cat.wedding"), slug: "wedding", count: 32, color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    { name: t("cat.holiday"), slug: "holiday", count: 28, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { name: t("cat.graduation"), slug: "graduation", count: 24, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    { name: t("cat.corporate"), slug: "corporate", count: 18, color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    { name: t("cat.social"), slug: "social media", count: 36, color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  ]

  const testimonials = [
    {
      quote: t("test.1.quote"),
      author: t("test.1.author"),
      role: t("test.1.role"),
    },
    {
      quote: t("test.2.quote"),
      author: t("test.2.author"),
      role: t("test.2.role"),
    },
    {
      quote: t("test.3.quote"),
      author: t("test.3.author"),
      role: t("test.3.role"),
    },
  ]

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30 selection:text-foreground">
      <Header />

      <main className="flex-1 overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-24 flex flex-col items-center justify-center">
          {/* Neon Radial Rotating Background Glows */}
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />
          <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-[8000ms]" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse duration-[6000ms]" />

          <div className="relative mx-auto max-w-7xl px-4 text-center z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-spin duration-3000" />
                {t("home.badge")}
              </Badge>
            </motion.div>

            <motion.h1 
              className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl text-balance max-w-5xl mx-auto leading-[1.1]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              {t("home.title1")}{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(var(--primary),0.15)]">
                {t("home.title2")}
              </span>
            </motion.h1>

            <motion.p 
              className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty font-light leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {t("home.subtitle")}
            </motion.p>

            <motion.div 
              className="mt-12 flex items-center justify-center gap-4 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link href="/editor">
                <Button size="lg" className="h-13 px-8 rounded-full font-semibold text-base gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/95 hover:to-purple-600/95 shadow-[0_8px_30px_rgb(var(--primary)/0.3)] hover:shadow-[0_8px_30px_rgb(var(--primary)/0.5)] hover:scale-[1.02] active:scale-95 transition-all duration-300">
                  {t("home.startCreating")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="h-13 px-8 rounded-full font-semibold text-base border-border/80 hover:bg-muted/50 hover:scale-[1.02] active:scale-95 transition-all duration-300">
                  {t("home.browseTemplates")}
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Interactive Before/After Frame Slider Container */}
          <motion.div 
            className="w-full mt-16 z-10"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          >
            <LandingPreviewSlider />
          </motion.div>
        </section>

        {/* Categories Section */}
        <section className="py-24 bg-muted/20 border-y border-border/40 relative">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                {t("home.catTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground font-light">
                {t("home.catSubtitle")}
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
            >
              {categories.map((category) => (
                <motion.div
                  key={category.name}
                  variants={fadeInUp}
                  whileHover={{ y: -8, scale: 1.03 }}
                  className="h-full"
                >
                  <Link href={`/gallery?category=${category.slug}`} className="h-full block">
                    <Card className="h-full overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer bg-card/60 backdrop-blur-md border-border/60 hover:border-primary/40 group">
                      <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
                        <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${category.color}`}>
                          {category.count} Templates
                        </Badge>
                        <h3 className="mt-4 font-bold text-lg group-hover:text-primary transition-colors duration-300">
                          {category.name}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/gallery">
                <Button variant="outline" size="lg" className="rounded-full gap-2 border-border/80 hover:bg-muted/50 transition-colors duration-300">
                  {t("home.viewAll")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
          <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                {t("home.featTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground font-light">
                {t("home.featSubtitle")}
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  whileHover={{ y: -6 }}
                >
                  <Card className="h-full bg-card/40 backdrop-blur-md border border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 group">
                    <CardContent className="p-8">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                        <feature.icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                      <p className="text-muted-foreground font-light leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-muted/20 border-y border-border/40 relative">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                {t("home.howTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground font-light">
                {t("home.howSubtitle")}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {[
                {
                  step: "01",
                  title: t("how.step1.title"),
                  description: t("how.step1.desc"),
                },
                {
                  step: "02",
                  title: t("how.step2.title"),
                  description: t("how.step2.desc"),
                },
                {
                  step: "03",
                  title: t("how.step3.title"),
                  description: t("how.step3.desc"),
                },
              ].map((item, index) => (
                <motion.div 
                  key={item.step} 
                  className="relative"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-16 left-[70%] w-[60%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent z-0" />
                  )}
                  <Card className="relative bg-card/60 backdrop-blur-md rounded-3xl p-8 border border-border/60 hover:border-primary/20 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-0">
                      <span className="text-6xl font-black bg-gradient-to-br from-primary/30 to-purple-500/10 bg-clip-text text-transparent">{item.step}</span>
                      <h3 className="mt-4 text-2xl font-bold">{item.title}</h3>
                      <p className="mt-3 text-muted-foreground font-light leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 relative">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                {t("home.testTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground font-light">
                {t("home.testSubtitle")}
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
            >
              {testimonials.map((testimonial, idx) => (
                <motion.div
                  key={testimonial.author}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, rotate: idx % 2 === 0 ? 0.5 : -0.5 }}
                >
                  <Card className="h-full bg-card/40 backdrop-blur-md border border-border/60 shadow-md flex flex-col justify-between p-8 hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="flex gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className="w-5 h-5 text-amber-400 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-foreground text-base italic font-light leading-relaxed mb-6">&quot;{testimonial.quote}&quot;</p>
                    </CardContent>
                    <div className="border-t border-border/60 pt-4">
                      <p className="font-bold text-base">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground font-light">{testimonial.role}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-28 relative overflow-hidden bg-primary text-primary-foreground">
          {/* Glow effects inside CTA */}
          <div className="absolute inset-0 bg-linear-to-r from-primary to-purple-800 opacity-90" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative mx-auto max-w-5xl px-4 text-center z-10">
            <motion.h2 
              className="text-4xl font-extrabold tracking-tight sm:text-6xl"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {t("home.ctaTitle")}
            </motion.h2>
            <motion.p 
              className="mt-6 text-lg opacity-90 max-w-2xl mx-auto font-light leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {t("home.ctaSubtitle")}
            </motion.p>
            <motion.div 
              className="mt-12 flex items-center justify-center gap-6 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="h-13 px-8 rounded-full font-bold text-base bg-white text-primary hover:bg-white/90 shadow-xl hover:scale-[1.02] transition-all">
                  {t("home.ctaBtn")}
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Check className="w-5 h-5 text-white/90" />
                <span>{t("home.ctaNoCard")}</span>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
