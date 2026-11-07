import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { randomUUID } from "crypto"
import { createFrameSchema, updateFrameSchema, slugify } from "@/lib/validations"
import { z } from "zod"

// GET: Fetch a single frame by ?id= (public for shared links) or frames created by the logged-in user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const supabase = createAdminClient()

    // Public lookup for a specific frame shared via link (/editor?frame=ID or /editor?frame=SLUG)
    if (id) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      let frame: any = null

      if (isUUID) {
        const { data } = await supabase
          .from("frames")
          .select("*, category:categories(*)")
          .eq("id", id)
          .maybeSingle()
        frame = data
      }

      // If not UUID or UUID didn't match, search by slug or matching name
      if (!frame) {
        const cleanSlug = id.trim().toLowerCase()
        try {
          const { data } = await supabase
            .from("frames")
            .select("*, category:categories(*)")
            .eq("slug", cleanSlug)
            .maybeSingle()
          frame = data
        } catch {
          // 'slug' column might not exist yet
        }

        // Fallback: search by name matching the slug
        if (!frame) {
          const nameGuess = cleanSlug.replace(/-/g, " ")
          const { data } = await supabase
            .from("frames")
            .select("*, category:categories(*)")
            .ilike("name", `%${nameGuess}%`)
            .limit(1)
          if (data && data.length > 0) {
            frame = data[0]
          }
        }
      }

      if (!frame) {
        return NextResponse.json(
          { success: false, error: "Cadre introuvable." },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        frame
      })
    }

    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour accéder à vos cadres." },
        { status: 401 }
      )
    }

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

    const { name, slug: customSlug, description, categoryId, tags, base64Image, isPublic, isActive } = parsed.data

    const supabase = createAdminClient()

    // 1. Ensure the public 'frames' bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      if (!buckets?.some((b) => b.name === "frames")) {
        await supabase.storage.createBucket("frames", {
          public: true,
          fileSizeLimit: 10485760 // 10MB limit
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
    const { error: uploadError } = await supabase.storage
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

    // 5. Generate and format slug
    let initialSlug = customSlug ? slugify(customSlug) : slugify(name)
    if (!initialSlug) initialSlug = "cadre-" + randomUUID().slice(0, 8)

    // 6. Insert record in 'frames' table
    const insertPayload: Record<string, any> = {
      name,
      slug: initialSlug,
      description: description || null,
      image_url: publicUrl,
      thumbnail_url: publicUrl,
      category_id: categoryId || null,
      tags: tags || [],
      is_premium: false, // Default to standard frames for users
      is_public: isPublic !== undefined ? isPublic : true,
      is_active: isActive !== undefined ? isActive : true,
      created_by: session.user.id
    }

    let { data: frameData, error: dbError } = await supabase
      .from("frames")
      .insert(insertPayload)
      .select()
      .single()

    // Graceful recovery if 'slug' column does not exist yet or if slug is already taken
    if (dbError) {
      if (dbError.code === "23505" || dbError.message?.toLowerCase().includes("unique")) {
        // Unique violation on slug: append 4 random chars and retry
        insertPayload.slug = `${initialSlug}-${randomUUID().slice(0, 4)}`
        const retry = await supabase.from("frames").insert(insertPayload).select().single()
        frameData = retry.data
        dbError = retry.error
      } else if (dbError.code === "42703" || dbError.message?.toLowerCase().includes("slug")) {
        // Column 'slug' does not exist yet: retry insert without slug
        delete insertPayload.slug
        const retry = await supabase.from("frames").insert(insertPayload).select().single()
        frameData = retry.data
        dbError = retry.error
      }
    }

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

// PUT: Update an existing frame template
export async function PUT(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour modifier un cadre." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = updateFrameSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Données invalides"
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

    const { id, name, slug: customSlug, description, categoryId, tags, base64Image, isPublic, isActive } = parsed.data
    const supabase = createAdminClient()

    // 1. Fetch existing frame to verify ownership
    const { data: existingFrame, error: fetchError } = await supabase
      .from("frames")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError || !existingFrame) {
      return NextResponse.json(
        { success: false, error: "Cadre introuvable." },
        { status: 404 }
      )
    }

    const userRole = (session.user as any)?.role
    const isOwner = existingFrame.created_by === session.user.id
    const isAdmin = userRole === "admin" || userRole === "super_admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Vous n'êtes pas autorisé à modifier ce cadre." },
        { status: 403 }
      )
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (customSlug !== undefined) {
      updateData.slug = customSlug ? slugify(customSlug) : (name ? slugify(name) : null)
    }
    if (description !== undefined) updateData.description = description || null
    if (categoryId !== undefined) updateData.category_id = categoryId || null
    if (tags !== undefined) updateData.tags = tags
    if (isPublic !== undefined) updateData.is_public = isPublic
    if (isActive !== undefined) updateData.is_active = isActive

    // 2. If a new base64 image is provided, upload it and update image URLs
    if (base64Image) {
      try {
        const { data: buckets } = await supabase.storage.listBuckets()
        if (!buckets?.some((b) => b.name === "frames")) {
          await supabase.storage.createBucket("frames", {
            public: true,
            fileSizeLimit: 10485760
          })
        }
      } catch (bucketError) {
        console.warn("Could not check/create bucket 'frames':", bucketError)
      }

      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64Data, "base64")
      const fileId = randomUUID()
      const fileName = `templates/${existingFrame.created_by || session.user.id}/${fileId}.png`

      const { error: uploadError } = await supabase.storage
        .from("frames")
        .upload(fileName, buffer, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: true
        })

      if (uploadError) {
        console.error("Storage upload error during frame update:", uploadError)
        return NextResponse.json(
          { success: false, error: "Échec du téléversement de la nouvelle image." },
          { status: 500 }
        )
      }

      const { data: { publicUrl } } = supabase.storage
        .from("frames")
        .getPublicUrl(fileName)

      updateData.image_url = publicUrl
      updateData.thumbnail_url = publicUrl
    }

    // 3. Update record in database
    let { data: updatedFrame, error: updateError } = await supabase
      .from("frames")
      .update(updateData)
      .eq("id", id)
      .select("*, category:categories(*)")
      .single()

    if (updateError) {
      if (updateError.code === "23505" || updateError.message?.toLowerCase().includes("unique")) {
        // Unique violation on slug: append 4 random chars and retry
        updateData.slug = `${updateData.slug}-${randomUUID().slice(0, 4)}`
        const retry = await supabase.from("frames").update(updateData).eq("id", id).select("*, category:categories(*)").single()
        updatedFrame = retry.data
        updateError = retry.error
      } else if (updateError.code === "42703" || updateError.message?.toLowerCase().includes("slug")) {
        // Column 'slug' does not exist yet: retry update without slug
        delete updateData.slug
        const retry = await supabase.from("frames").update(updateData).eq("id", id).select("*, category:categories(*)").single()
        updatedFrame = retry.data
        updateError = retry.error
      }
    }

    if (updateError) {
      console.error("Database update frame error:", updateError)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la mise à jour du cadre." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      frame: updatedFrame
    })

  } catch (error) {
    console.error("Frames PUT route error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "L'identifiant du cadre est requis." },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Verify existence and ownership
    const { data: existingFrame, error: fetchError } = await supabase
      .from("frames")
      .select("id, created_by, image_url, thumbnail_url")
      .eq("id", id)
      .single()

    if (fetchError || !existingFrame) {
      return NextResponse.json(
        { success: false, error: "Cadre introuvable." },
        { status: 404 }
      )
    }

    const userRole = (session.user as any).role
    const isOwner = existingFrame.created_by === session.user.id
    const isAdmin = userRole === "admin" || userRole === "super_admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Vous n'êtes pas autorisé à supprimer ce cadre." },
        { status: 403 }
      )
    }

    // 2. Delete frame record from database (cascades to frame_likes, etc.)
    const { error: deleteError } = await supabase
      .from("frames")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Database delete frame error:", deleteError)
      return NextResponse.json(
        { success: false, error: "Erreur lors de la suppression du cadre en base de données." },
        { status: 500 }
      )
    }

    // 3. Clean up storage files if stored in our 'frames' bucket
    try {
      const getStoragePath = (url: string | null) => {
        if (!url) return null
        const marker = "/storage/v1/object/public/frames/"
        const idx = url.indexOf(marker)
        if (idx !== -1) {
          return url.slice(idx + marker.length)
        }
        return null
      }

      const pathsToRemove = [
        getStoragePath(existingFrame.image_url),
        getStoragePath(existingFrame.thumbnail_url),
      ].filter(Boolean) as string[]

      const uniquePaths = Array.from(new Set(pathsToRemove))
      if (uniquePaths.length > 0) {
        await supabase.storage.from("frames").remove(uniquePaths)
      }
    } catch (storageCleanupError) {
      console.warn("Storage cleanup failed for deleted frame (non-blocking):", storageCleanupError)
    }

    return NextResponse.json({
      success: true,
      message: "Cadre supprimé avec succès."
    })

  } catch (error) {
    console.error("Frames DELETE route error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}
