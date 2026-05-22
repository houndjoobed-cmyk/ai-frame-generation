"use client"

import { useRouter } from "next/navigation"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface DeleteProjectButtonProps {
  projectId: string
  projectName: string
}

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${projectName}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/projects?id=${projectId}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete")
      }

      toast.success("Project deleted")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project")
    }
  }

  return (
    <DropdownMenuItem
      onClick={handleDelete}
      className="text-destructive focus:text-destructive"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  )
}
