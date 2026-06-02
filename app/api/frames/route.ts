import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { randomUUID } from "crypto"
import { createFrameSchema } from "@/lib/validations"

// GET: Fetch frames created by the currently logged-in user
export async function GET(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour accéder à vos cadres." },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()
    const { data: frames, error } = await supabase
      .from("frames")
      .select("*, category:categories(*)")
      .eq("created_by", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database query error:", error)
      return NextResponse.json(
        { success: false, error: "Impossible de récupérer vos cadres." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      frames
    })

  } catch (error) {
    console.error("Frames GET route error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}

// POST: Create a new frame template (upload image & insert db record)
export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour créer un cadre." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = createFrameSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Données invalides"
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

    const { name, description, categoryId, tags, base64Image, isPublic, isActive } = parsed.data

    const supabase = createAdminClient()

    // 1. Ensure the public 'frames' bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      if (!buckets?.some((b) => b.name === "frames")) {
        await supabase.storage.createBucket("frames", {
          public: true,
          fileSizeLimit: 5242880 // 5MB limit
        })
      }
    } catch (bucketError) {
      console.warn("Could not check/create bucket 'frames':", bucketError)
    }

    // 2. Decode base64 image data
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    const fileId = randomUUID()
    const fileName = `templates/${session.user.id}/${fileId}.png`

    // 3. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("frames")
      .upload(fileName, buffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { success: false, error: "Échec de l'enregistrement du fichier image du cadre." },
        { status: 500 }
      )
    }

    // 4. Retrieve the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("frames")
      .getPublicUrl(fileName)

    // 5. Insert record in 'frames' table
    const { data: frameData, error: dbError } = await supabase
      .from("frames")
      .insert({
        name,
        description: description || null,
        image_url: publicUrl,
        thumbnail_url: publicUrl,
        category_id: categoryId || null,
        tags: tags || [],
        is_premium: false, // Default to standard frames for users
        is_public: isPublic !== undefined ? isPublic : true,
        is_active: isActive !== undefined ? isActive : true,
        created_by: session.user.id
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error saving frame:", dbError)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création du cadre dans la base de données." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      frame: frameData
    })

  } catch (error) {
    console.error("Frames POST route error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}
