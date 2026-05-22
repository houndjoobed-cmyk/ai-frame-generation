"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, User } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const supabase = createClient()
  const { t } = useI18n()

  const [name, setName] = useState(session?.user?.name || "")
  const [bio, setBio] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Update profile in database
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session?.user?.id,
          display_name: name,
          bio,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      // Update session
      await update({ name })

      toast.success(t("settings.toast.updated"))
      router.refresh()
    } catch {
      toast.error(t("settings.toast.updateFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("settings.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
          <CardDescription>
            {t("settings.profileDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="text-2xl">
                  {session?.user?.name?.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{session?.user?.name || "User"}</h3>
                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("settings.displayName")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("settings.namePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("settings.email")}</Label>
                <Input
                  id="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t("settings.emailDesc")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t("settings.bio")}</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("settings.bioPlaceholder")}
                  rows={3}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("settings.saveChanges")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.account")}</CardTitle>
          <CardDescription>
            {t("settings.accountDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{t("settings.signOut")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("settings.signOutDesc")}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/api/auth/signout")}>
              {t("settings.signOut")}
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-destructive">{t("settings.deleteAccount")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("settings.deleteAccountDesc")}
              </p>
            </div>
            <Button variant="destructive" disabled>
              {t("settings.deleteAccount")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
