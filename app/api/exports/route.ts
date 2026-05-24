import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const supabase = createAdminClient()
    
    const { projectId, width, height, fileFormat, exportPreset } = await req.json()

    // 1. Identify User and Active Subscription
    let userId = session?.user?.id
    let plan: any = null
    let maxExports = 5 // Free/Starter default
    let hasHdExport = false

    if (userId) {
      // Fetch user subscription and plan properties
      const { data: sub, error: subError } = await supabase
        .from("user_subscriptions")
        .select("*, plan:subscription_plans(*)")
        .eq("user_id", userId)
        .in("status", ["active", "cancelled"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const isSubActive = sub && (
        sub.status === "active" || 
        (sub.status === "cancelled" && sub.current_period_end && new Date(sub.current_period_end) > new Date())
      )

      if (isSubActive && sub && sub.plan) {
        plan = sub.plan
        maxExports = plan.max_exports_per_month ?? 9999
        hasHdExport = plan.has_hd_export ?? false
      }
    } else {
      // If guest user, standard resolution only (max 1080px), limit to 3 exports
      // For simplicity, guests can only export standard sizes
      maxExports = 3
      hasHdExport = false
    }

    // 2. Classify Resolution Quality
    const maxDimension = Math.max(width || 0, height || 0)
    const requestedQuality = maxDimension > 1200 ? (maxDimension > 2500 ? "ultra_hd" : "hd") : "standard"

    // 3. Enforce HD/Ultra HD limits
    if (requestedQuality !== "standard" && !hasHdExport) {
      return NextResponse.json(
        {
          success: false,
          code: "UPGRADE_REQUIRED",
          error: "L'exportation en Haute Définition (HD/4K) est réservée aux forfaits Pro et Entreprise."
        },
        { status: 403 }
      )
    }

    // 4. Enforce Monthly Count Limits (only if logged in, to track accurately)
    if (userId) {
      // Count exports in current month / billing period
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count, error: countError } = await supabase
        .from("exports")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("created_at", startOfMonth.toISOString())

      if (countError) {
        console.error("Error counting user exports:", countError)
      } else if (count !== null && count >= maxExports) {
        return NextResponse.json(
          {
            success: false,
            code: "LIMIT_REACHED",
            error: `Vous avez atteint votre limite mensuelle de ${maxExports} exportations. Veuillez mettre à niveau votre forfait.`
          },
          { status: 403 }
        )
      }
    }

    // 5. Log the export event
    const { error: insertError } = await supabase
      .from("exports")
      .insert({
        user_id: userId || "00000000-0000-0000-0000-000000000000", // guest UUID or mock guest entry
        project_id: projectId || null,
        file_format: fileFormat || "png",
        export_preset: exportPreset || "square",
        width: width || 1080,
        height: height || 1080,
        quality: requestedQuality,
        status: "completed"
      })

    if (insertError) {
      console.error("Database error logging export:", insertError)
    }

    return NextResponse.json({ success: true, quality: requestedQuality })

  } catch (error) {
    console.error("Export endpoint error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}
