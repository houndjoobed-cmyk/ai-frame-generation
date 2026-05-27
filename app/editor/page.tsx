import { Suspense } from "react"
import { EditorCanvas } from "@/components/editor/editor-canvas"

export const metadata = {
  title: "Frame Editor",
  description: "Create and customize your photo frames with our powerful editor.",
}

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditorCanvas />
    </Suspense>
  )
}

function EditorSkeleton() {
  return (
    <div className="h-dvh w-full overflow-hidden flex">
      <div className="w-72 border-r bg-muted/30 p-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded-lg mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-muted/10">
        <div className="w-[600px] h-[600px] bg-muted animate-pulse rounded-xl" />
      </div>
      <div className="w-72 border-l bg-muted/30 p-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded-lg mb-6" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
