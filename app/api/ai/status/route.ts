import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

const MOCK_IMAGES: Record<string, string> = {
  standard: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1000&auto=format&fit=crop",
  festive: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop",
  elegant: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000&auto=format&fit=crop",
  neon: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1000&auto=format&fit=crop",
  cartoon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const predictionId = searchParams.get("id")
    const generationId = searchParams.get("genId")

    if (!predictionId || !generationId) {
      return NextResponse.json(
        { success: false, error: "Paramètres manquants." },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Fetch current database record
    const { data: genRow, error: genError } = await supabase
      .from("ai_generations")
      .select("*")
      .eq("id", generationId)
      .single()

    if (genError || !genRow) {
      console.error("Database error fetching generation log:", genError)
      return NextResponse.json({ success: false, error: "Log de génération non trouvé." }, { status: 404 })
    }

    // If already finalized, return directly
    if (genRow.status === "completed") {
      return NextResponse.json({
        success: true,
        status: "succeeded",
        imageUrl: genRow.generated_image_url
      })
    }

    if (genRow.status === "failed") {
      return NextResponse.json({
        success: true,
        status: "failed",
        error: genRow.error_message
      })
    }

    // 2. Handle Mock Predictions
    if (predictionId.startsWith("mock_")) {
      const createdTime = new Date(genRow.created_at).getTime()
      const elapsedSeconds = (Date.now() - createdTime) / 1000

      // Simulate a 4-second generation delay
      if (elapsedSeconds < 4) {
        return NextResponse.json({
          success: true,
          status: "processing"
        })
      }

      // Finish Mock Generation
      const mockStyle = genRow.style || "standard"
      const imageUrl = MOCK_IMAGES[mockStyle] || MOCK_IMAGES.standard

      // Update Database to completed
      await supabase
        .from("ai_generations")
        .update({
          status: "completed",
          generated_image_url: imageUrl,
          completed_at: new Date().toISOString()
        })
        .eq("id", generationId)

      return NextResponse.json({
        success: true,
        status: "succeeded",
        imageUrl
      })
    }

    // 3. Handle Real Replicate API Predictions
    const replicateToken = process.env.REPLICATE_API_TOKEN
    if (!replicateToken) {
      return NextResponse.json({ success: false, error: "Replicate token configuration error." }, { status: 500 })
    }

    const replicateRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        "Authorization": `Token ${replicateToken}`,
        "Accept": "application/json"
      }
    })

    if (!replicateRes.ok) {
      const errText = await replicateRes.text()
      console.error("Replicate API check error:", errText)
      return NextResponse.json({ success: false, error: "Failed to query Replicate API." }, { status: 502 })
    }

    const replicateData = await replicateRes.json()
    const repStatus = replicateData.status // starting, processing, succeeded, failed, canceled

    if (repStatus === "succeeded") {
      const imageUrl = replicateData.output?.[0]
      if (!imageUrl) {
        throw new Error("No image output returned from Replicate API.")
      }

      // Update Database
      await supabase
        .from("ai_generations")
        .update({
          status: "completed",
          generated_image_url: imageUrl,
          completed_at: new Date().toISOString()
        })
        .eq("id", generationId)

      return NextResponse.json({
        success: true,
        status: "succeeded",
        imageUrl
      })
    }

    if (repStatus === "failed" || repStatus === "canceled") {
      // Refund user credit since generation failed
      const { data: credits } = await supabase
        .from("ai_credits")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (credits) {
        const usedCredits = credits.used_credits || 0
        await supabase
          .from("ai_credits")
          .update({
            used_credits: Math.max(0, usedCredits - 1),
            updated_at: new Date().toISOString()
          })
          .eq("user_id", session.user.id)
      }

      const errorMessage = replicateData.error || "Génération annulée ou échouée."

      // Update Database
      await supabase
        .from("ai_generations")
        .update({
          status: "failed",
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq("id", generationId)

      return NextResponse.json({
        success: true,
        status: "failed",
        error: errorMessage
      })
    }

    // Still processing/starting
    return NextResponse.json({
      success: true,
      status: "processing"
    })

  } catch (error) {
    console.error("AI Status checking error:", error)
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 })
  }
}
