import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  
  let frame: any = null
  if (isUUID) {
    const { data } = await supabase
      .from("frames")
      .select("name, description, image_url")
      .eq("id", slug)
      .maybeSingle()
    frame = data
  }
  if (!frame) {
    try {
      const { data } = await supabase
        .from("frames")
        .select("name, description, image_url")
        .eq("slug", slug.toLowerCase())
        .maybeSingle()
      frame = data
    } catch {
      // Column 'slug' might not exist yet
    }
  }
  if (!frame) {
    const nameGuess = slug.replace(/-/g, " ")
    const { data } = await supabase
      .from("frames")
      .select("name, description, image_url")
      .ilike("name", `%${nameGuess}%`)
      .limit(1)
    if (data && data.length > 0) frame = data[0]
  }

  if (!frame) {
    return {
      title: "Cadre Photo - EventFrames",
      description: "Personnalisez votre photo avec ce cadre événementiel.",
    }
  }

  return {
    title: `${frame.name} - Ajoutez votre photo`,
    description: frame.description || "Ajoutez instantanément votre photo sur ce cadre en un clic.",
    openGraph: {
      title: `${frame.name} - Ajoutez votre photo`,
      description: frame.description || "Ajoutez instantanément votre photo sur ce cadre en un clic.",
      images: frame.image_url ? [{ url: frame.image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${frame.name} - Ajoutez votre photo`,
      description: frame.description || "Ajoutez instantanément votre photo sur ce cadre en un clic.",
      images: frame.image_url ? [frame.image_url] : [],
    }
  }
}

export default async function ShortFramePage({ params }: Props) {
  const { slug } = await params
  redirect(`/editor?frame=${encodeURIComponent(slug)}`)
}

