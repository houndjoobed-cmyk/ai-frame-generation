import { createAdminClient } from "@/lib/supabase/admin"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SharePageContent } from "@/components/share/share-content"
import { notFound } from "next/navigation"

interface SharePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: SharePageProps) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("exports")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!data || !data.file_url) {
    return {
      title: "Cadre Photo - Event Frames",
      description: "Découvrez cette photo encadrée !",
    }
  }

  return {
    title: "Mon magnifique cadre photo ! - Event Frames",
    description: "Créé avec Event Frames. Créez et téléchargez vos propres cadres personnalisés gratuitement !",
    openGraph: {
      title: "Mon magnifique cadre photo ! - Event Frames",
      description: "Créé avec Event Frames. Créez et téléchargez vos propres cadres personnalisés gratuitement !",
      images: [{ url: data.file_url }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Mon magnifique cadre photo ! - Event Frames",
      description: "Créé avec Event Frames. Créez et téléchargez vos propres cadres personnalisés gratuitement !",
      images: [data.file_url],
    }
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from("exports")
    .select("id, file_url")
    .eq("id", params.id)
    .single()

  if (error || !data) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-primary selection:text-primary-foreground">
      <Header />
      <main className="flex-1 flex items-center justify-center relative overflow-hidden">
        <SharePageContent exportData={data} />
      </main>
      <Footer />
    </div>
  )
}
