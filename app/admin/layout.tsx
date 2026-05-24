import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { Header } from "@/components/header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export const metadata = {
  title: "Administration",
  description: "Panel d'administration Event Frames",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/admin")
  }

  // Verify admin role
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .single()

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
