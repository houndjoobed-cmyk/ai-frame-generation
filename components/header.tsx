"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Frame, Menu, X, User, Settings, LogOut, LayoutDashboard, Globe, Sun, Moon, Shield, FolderOpen, Heart, Plus, Bell, Paintbrush } from "lucide-react"
import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/i18n-context"
import { useTheme } from "next-themes"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { motion, AnimatePresence } from "framer-motion"

import Image from "next/image"

export function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { locale, setLocale, t } = useI18n()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDashboardOrAdmin = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")
  const userRole = (session?.user as any)?.role
  const showAdminLink = userRole === "admin" || userRole === "super_admin"

  const dashboardNavigation = [
    { name: t("header.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("dashboard.myProjects"), href: "/dashboard/projects", icon: FolderOpen },
    { name: t("dashboard.myFrames"), href: "/dashboard/frames", icon: Frame },
    { name: t("dashboard.createFrame"), href: "/dashboard/frames/create", icon: Plus },
    { name: t("dashboard.customOrders"), href: "/dashboard/custom-orders", icon: Paintbrush },
    { name: t("dashboard.likedFrames"), href: "/dashboard/liked", icon: Heart },
    { name: t("notifications.title"), href: "/dashboard/notifications", icon: Bell },
    { name: t("header.settings"), href: "/dashboard/settings", icon: Settings },
  ]

  if (showAdminLink) {
    dashboardNavigation.push({
      name: t("admin.title") || "Administration",
      href: "/admin",
      icon: Shield,
    })
  }

  const navigation = [
    { name: t("nav.gallery"), href: "/gallery" },
    { name: t("nav.editor"), href: "/editor" },
    { name: t("nav.pricing"), href: "/pricing" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-full.png"
              alt="Event Frames"
              width={160}
              height={40}
              className="h-10 w-auto object-contain dark:invert-0"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group py-2"
              >
                {item.name}
                <motion.span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell — only for logged-in users */}
          {session && <NotificationBell />}

          {/* Theme Toggle & Language Switcher (only for anonymous users) */}
          {status !== "loading" && !session && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {mounted && theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 gap-1 px-2 text-muted-foreground hover:text-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase">{locale}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem
                    className={`cursor-pointer ${locale === "en" ? "bg-accent font-medium" : ""}`}
                    onClick={() => setLocale("en")}
                  >
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={`cursor-pointer ${locale === "fr" ? "bg-accent font-medium" : ""}`}
                    onClick={() => setLocale("fr")}
                  >
                    Français
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : session ? (
            <div className="flex items-center gap-4">
              <Link href="/editor" className="hidden sm:block">
                <Button size="sm">{t("header.createFrame")}</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {session.user?.name && (
                        <p className="font-medium">{session.user.name}</p>
                      )}
                      {session.user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {t("header.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      {t("header.settings")}
                    </Link>
                  </DropdownMenuItem>
                  {/* Admin link — only visible for admin/super_admin */}
                  {(session.user?.role === "admin" || session.user?.role === "super_admin") && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        {t("header.admin")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />

                  {/* Theme Switcher (Segmented Control) */}
                  <div className="flex items-center justify-between px-2 py-1.5 text-sm text-foreground">
                    <div className="flex items-center text-muted-foreground select-none">
                      {mounted && theme === "dark" ? (
                        <Moon className="mr-2 h-4 w-4" />
                      ) : (
                        <Sun className="mr-2 h-4 w-4" />
                      )}
                      <span>{t("header.theme")}</span>
                    </div>
                    <div className="flex rounded-md border bg-muted p-0.5 select-none">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`rounded-sm px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer outline-hidden ${
                          theme === "light"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t("header.themeLabelLight")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`rounded-sm px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer outline-hidden ${
                          theme === "dark"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t("header.themeLabelDark")}
                      </button>
                    </div>
                  </div>

                  {/* Language Switcher (Segmented Control) */}
                  <div className="flex items-center justify-between px-2 py-1.5 text-sm text-foreground">
                    <div className="flex items-center text-muted-foreground select-none">
                      <Globe className="mr-2 h-4 w-4" />
                      <span>{t("header.language")}</span>
                    </div>
                    <div className="flex rounded-md border bg-muted p-0.5 select-none">
                      <button
                        type="button"
                        onClick={() => setLocale("en")}
                        className={`rounded-sm px-2.5 py-0.5 text-xs font-semibold transition-all cursor-pointer outline-hidden ${
                          locale === "en"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocale("fr")}
                        className={`rounded-sm px-2.5 py-0.5 text-xs font-semibold transition-all cursor-pointer outline-hidden ${
                          locale === "fr"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        FR
                      </button>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("header.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  {t("header.signIn")}
                </Button>
              </Link>
              <Link href="/auth/register" className="hidden sm:block">
                <Button size="sm">{t("header.getStarted")}</Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            className="md:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t overflow-hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {/* If on a dashboard/admin route, show dashboard links first */}
              {session && isDashboardOrAdmin && (
                <div className="space-y-1 pb-3 mb-3 border-b">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Menu Dashboard
                  </div>
                  {dashboardNavigation.map((item, i) => {
                    const isActive = pathname === item.href
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      </motion.div>
                    )
                  })}
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                    Navigation Site
                  </div>
                </div>
              )}

              {/* Standard Public Site Navigation */}
              {navigation.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (session && isDashboardOrAdmin ? dashboardNavigation.length : 0) * 0.03 + i * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}

              {session && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (isDashboardOrAdmin ? dashboardNavigation.length : 0) * 0.03 + navigation.length * 0.05 }}
                  >
                    <Link
                      href="/editor"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-primary hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("header.createFrame")}
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (isDashboardOrAdmin ? dashboardNavigation.length : 0) * 0.03 + (navigation.length + 1) * 0.05 }}
                  >
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        signOut()
                      }}
                      className="w-full text-left block rounded-lg px-3 py-2 text-base font-medium text-destructive hover:bg-destructive/10"
                    >
                      {t("header.signOut")}
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

