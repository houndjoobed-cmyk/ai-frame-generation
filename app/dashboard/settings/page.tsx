import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { SettingsContent } from "@/components/dashboard/settings-content"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Settings - Event Frames",
  description: "Manage your profile, active subscription, and billing history.",
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/settings")
  }

  const supabase = createAdminClient()

  // 1. Fetch profile details
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle()

  // 2. Fetch subscription details (joining subscription_plans)
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("user_id", session.user.id)
    .in("status", ["active", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // 3. Fetch payment history
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  return (
    <SettingsContent
      initialProfile={profile || null}
      initialSubscription={subscription || null}
      initialPayments={payments || []}
    />
  )
}
