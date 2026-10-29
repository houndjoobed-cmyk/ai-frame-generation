import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { randomUUID } from "crypto"
import { shareSchema } from "@/lib/validations"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id || null

    const body = await req.json()
    const parsed = shareSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Données invalides"
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

    const { base64Image, projectId, exportPreset, width, height } = parsed.data
    const supabase = createAdminClient()

    // 1. Ensure the public 'shares' bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      if (!buckets?.some((b) => b.name === "shares")) {
        await supabase.storage.createBucket("shares", {
          public: true,
          fileSizeLimit: 10485760 // 10MB
        })
      }
    } catch (bucketError) {
      console.warn("Could not check/create bucket 'shares':", bucketError)
    }

    // 2. Decode the base64 image
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    const folder = userId || "guest"
    const fileName = `${folder}/${randomUUID()}.png`

    // 3. Upload buffer to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("shares")
      .upload(fileName, buffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { success: false, error: "Échec de l'enregistrement de l'image de partage." },
        { status: 500 }
      )
    }

    // 4. Retrieve the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("shares")
      .getPublicUrl(fileName)

    // 5. Insert sharing record in 'exports' table
    let validProjectId: string | null = null
    if (projectId) {
      const { data: proj } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .maybeSingle()
      if (proj) {
        validProjectId = proj.id
      }
    }

    const guestUuid = "00000000-0000-0000-0000-000000000000"
    const exportPayload = {
      user_id: userId || guestUuid,
      project_id: validProjectId,
      file_url: publicUrl,
      file_format: "png",
      export_preset: exportPreset || "square",
      width: width || 800,
      height: height || 800,
      quality: "standard",
      file_size: buffer.length,
      status: "completed"
    }

    let { data: exportData, error: exportError } = await supabase
      .from("exports")
      .insert(exportPayload)
      .select()
      .single()

    if (exportError && !userId) {
      const { user_id: _unused, ...withoutUserId } = exportPayload
      const retry = await supabase
        .from("exports")
        .insert(withoutUserId)
        .select()
        .single()
      if (!retry.error) {
        exportData = retry.data
        exportError = null
      }
    }

    if (exportError || !exportData) {
      console.error("Database error saving export:", exportError)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création du lien de partage." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shareId: exportData.id,
      imageUrl: publicUrl
    })

  } catch (error) {
    console.error("Share API route error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}
