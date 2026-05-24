import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      )
    }

    const { prompt, negativePrompt, style } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Le prompt est requis." },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Atomically verify and deduct user credit (prevents race conditions)
    // First, try to atomically increment used_credits only if remaining > 0
    const { data: creditResult, error: creditError } = await supabase
      .rpc("deduct_ai_credit", { p_user_id: session.user.id })

    // Fallback if RPC doesn't exist yet: use conditional update
    let remaining = 0
    if (creditError) {
      // Fallback: conditional update that only succeeds if credits remain
      const { data: credits } = await supabase
        .from("ai_credits")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle()

      const totalCredits = credits?.total_credits ?? 5
      const usedCredits = credits?.used_credits ?? 0
      remaining = totalCredits - usedCredits

      if (remaining <= 0) {
        return NextResponse.json(
          { success: false, error: "Crédits IA insuffisants. Veuillez mettre à niveau votre forfait." },
          { status: 403 }
        )
      }

      // Conditional update: only deduct if used_credits hasn't changed since we read it
      const { data: updateResult, error: updateError } = await supabase
        .from("ai_credits")
        .update({
          used_credits: usedCredits + 1,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", session.user.id)
        .eq("used_credits", usedCredits) // Optimistic lock
        .select()
        .single()

      if (updateError || !updateResult) {
        return NextResponse.json(
          { success: false, error: "Conflit de crédits. Veuillez réessayer." },
          { status: 409 }
        )
      }

      remaining = totalCredits - (usedCredits + 1)
    } else {
      // RPC succeeded — creditResult contains remaining credits
      remaining = creditResult ?? 0
      if (remaining < 0) {
        return NextResponse.json(
          { success: false, error: "Crédits IA insuffisants. Veuillez mettre à niveau votre forfait." },
          { status: 403 }
        )
      }
    }

    // Determine stylized prompt
    let finalPrompt = prompt
    if (style === "festive") {
      finalPrompt = `${prompt}, festive decoration, celebration elements, balloons, confetti, gold sparkles, high resolution, 4k`
    } else if (style === "elegant") {
      finalPrompt = `${prompt}, elegant design, golden floral patterns, luxury frame border, professional lighting, photorealistic, 8k`
    } else if (style === "cartoon") {
      finalPrompt = `${prompt}, colorful cartoon style, whimsical illustration, vector art design, cute elements, high quality`
    } else if (style === "neon") {
      finalPrompt = `${prompt}, cyberpunk aesthetic, glowing neon frames, dark background, futuristic lighting, vibrant colors`
    }

    let predictionId = ""
    let isMock = false

    const replicateToken = process.env.REPLICATE_API_TOKEN

    // 2. Start generation on Replicate or use Mock fallback
    if (replicateToken && replicateToken !== "your_replicate_token_here") {
      try {
        const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // SDXL Model version
            version: "39ed5e0ceb41169ec7d7bab5f08190397007a0ad6e902c44e88e1e37c223a451",
            input: {
              prompt: finalPrompt,
              negative_prompt: negativePrompt || "blurry, low quality, distorted, bad anatomy",
              width: 1024,
              height: 1024,
              refine: "expert_ensemble_refiner",
              scheduler: "K_EULER",
              num_outputs: 1,
              guidance_scale: 7.5,
              high_noise_fraction: 0.8,
              num_inference_steps: 30
            }
          })
        })

        if (!replicateRes.ok) {
          const err = await replicateRes.text()
          throw new Error(`Replicate API returned error: ${err}`)
        }

        const replicateData = await replicateRes.json()
        predictionId = replicateData.id
      } catch (err) {
        console.error("Replicate API call failed, falling back to mock generation:", err)
        predictionId = "mock_" + Math.random().toString(36).substring(7)
        isMock = true
      }
    } else {
      predictionId = "mock_" + Math.random().toString(36).substring(7)
      isMock = true
    }

    // 3. Save Generation logs
    const { data: genRow, error: genError } = await supabase
      .from("ai_generations")
      .insert({
        user_id: session.user.id,
        prompt: finalPrompt,
        negative_prompt: negativePrompt || "",
        model: "stable-diffusion-xl",
        style: style || "standard",
        status: "pending",
        credits_used: 1,
        generation_params: {
          predictionId,
          isMock,
          originalPrompt: prompt,
        }
      })
      .select()
      .single()

    if (genError) {
      console.error("Database error saving AI generation:", genError)
      return NextResponse.json(
        { success: false, error: "Erreur lors de l'enregistrement de la génération." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      predictionId,
      generationId: genRow.id,
      isMock,
      remainingCredits: remaining
    })

  } catch (error) {
    console.error("AI Generate route error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur interne est survenue." },
      { status: 500 }
    )
  }
}
