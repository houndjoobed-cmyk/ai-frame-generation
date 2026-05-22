"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FolderOpen, Plus, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteProjectButton } from "@/components/dashboard/delete-project-button"
import { useI18n } from "@/lib/i18n/i18n-context"

interface ProjectsContentProps {
  projects: any[]
}

export function ProjectsContent({ projects }: ProjectsContentProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("projects.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("projects.subtitle")}
          </p>
        </div>
        <Link href="/editor">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t("dashboard.newProject")}
          </Button>
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden group">
              <div className="aspect-square bg-muted relative">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FolderOpen className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Link href={`/editor?project=${project.id}`}>
                    <Button size="sm">{t("projects.openEditor")}</Button>
                  </Link>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 bg-background/80 hover:bg-background"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/editor?project=${project.id}`}>
                        {t("projects.openEditor")}
                      </Link>
                    </DropdownMenuItem>
                    <DeleteProjectButton projectId={project.id} projectName={project.name} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{project.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("projects.updated")} {new Date(project.updated_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("projects.noProjects")}</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {t("projects.noProjectsDesc")}
            </p>
            <Link href="/editor">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                {t("projects.createFirst")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
