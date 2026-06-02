"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen, Heart, Download, Plus, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

interface RecentProject {
  id: string
  name: string
  thumbnail_url: string | null
  updated_at: string
}

interface DashboardContentProps {
  userName: string
  projectCount: number
  likesCount: number
  recentProjects: RecentProject[]
}

export function DashboardContent({
  userName,
  projectCount,
  likesCount,
  recentProjects,
}: DashboardContentProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("dashboard.welcome")} {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("dashboard.overview")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.projects")}</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.totalProjects")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.likedFrames")}</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{likesCount}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.likedDesc")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.downloads")}</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.downloadsDesc")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t("dashboard.recentProjects")}</h2>
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="sm" className="gap-1">
              {t("dashboard.viewAll")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {recentProjects && recentProjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recentProjects.map((project) => (
              <Link key={project.id} href={`/editor?project=${project.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-square bg-muted relative">
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FolderOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium truncate">{project.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <CardTitle className="text-lg mb-2">{t("dashboard.noProjects")}</CardTitle>
              <CardDescription className="mb-4 text-center">
                {t("dashboard.noProjectsDesc")}
              </CardDescription>
              <Link href="/editor">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t("dashboard.createFirst")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("dashboard.quickActions")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/editor">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("dashboard.newProject")}</h3>
                  <p className="text-sm text-muted-foreground">{t("dashboard.newProjectDesc")}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/gallery">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("dashboard.browseGallery")}</h3>
                  <p className="text-sm text-muted-foreground">{t("dashboard.browseGalleryDesc")}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/settings">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Heart className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("dashboard.accountSettings")}</h3>
                  <p className="text-sm text-muted-foreground">{t("dashboard.accountSettingsDesc")}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
