"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/i18n-context"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  sort_order: number
  is_active: boolean
  frame_count: number
}

export function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const { t } = useI18n()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formSlug, setFormSlug] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formIcon, setFormIcon] = useState("")
  const [formColor, setFormColor] = useState("#3B82F6")
  const [formSortOrder, setFormSortOrder] = useState(0)

  function resetForm() {
    setFormName("")
    setFormSlug("")
    setFormDescription("")
    setFormIcon("")
    setFormColor("#3B82F6")
    setFormSortOrder(0)
  }

  function fillFormFromCategory(cat: Category) {
    setFormName(cat.name)
    setFormSlug(cat.slug)
    setFormDescription(cat.description || "")
    setFormIcon(cat.icon || "")
    setFormColor(cat.color || "#3B82F6")
    setFormSortOrder(cat.sort_order)
  }

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  async function handleCreate() {
    if (!formName || !formSlug) {
      toast.error("Le nom et le slug sont requis")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          slug: formSlug,
          description: formDescription || null,
          icon: formIcon || null,
          color: formColor || null,
          sort_order: formSortOrder,
        }),
      })
      const json = await res.json()

      if (res.ok) {
        toast.success(t("admin.categoryCreated"))
        setCategories([...categories, { ...json.data, frame_count: 0 }])
        setIsCreateOpen(false)
        resetForm()
      } else {
        toast.error(json.error || "Erreur")
      }
    } catch {
      toast.error("Erreur de connexion")
    }
    setIsLoading(false)
  }

  async function handleUpdate() {
    if (!editingCategory) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategory.id,
          name: formName,
          slug: formSlug,
          description: formDescription || null,
          icon: formIcon || null,
          color: formColor || null,
          sort_order: formSortOrder,
        }),
      })
      const json = await res.json()

      if (res.ok) {
        toast.success(t("admin.categoryUpdated"))
        setCategories(
          categories.map((c) =>
            c.id === editingCategory.id ? { ...json.data, frame_count: c.frame_count } : c
          )
        )
        setEditingCategory(null)
        resetForm()
      } else {
        toast.error(json.error || "Erreur")
      }
    } catch {
      toast.error("Erreur de connexion")
    }
    setIsLoading(false)
  }

  async function handleDelete(categoryId: string) {
    try {
      const res = await fetch(`/api/admin/categories?id=${categoryId}`, { method: "DELETE" })
      const json = await res.json()

      if (res.ok) {
        toast.success(t("admin.categoryDeleted"))
        setCategories(categories.filter((c) => c.id !== categoryId))
      } else {
        toast.error(json.error || "Erreur")
      }
    } catch {
      toast.error("Erreur de connexion")
    }
  }

  const CategoryForm = ({ isEdit }: { isEdit: boolean }) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cat-name">{t("admin.catName")}</Label>
          <Input
            id="cat-name"
            value={formName}
            onChange={(e) => {
              setFormName(e.target.value)
              if (!isEdit) setFormSlug(autoSlug(e.target.value))
            }}
            placeholder="Anniversaire"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-slug">Slug</Label>
          <Input
            id="cat-slug"
            value={formSlug}
            onChange={(e) => setFormSlug(e.target.value)}
            placeholder="anniversaire"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-desc">{t("admin.catDescription")}</Label>
        <Input
          id="cat-desc"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          placeholder="Frames pour anniversaires"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cat-icon">{t("admin.catIcon")}</Label>
          <Input
            id="cat-icon"
            value={formIcon}
            onChange={(e) => setFormIcon(e.target.value)}
            placeholder="🎂"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-color">{t("admin.catColor")}</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              id="cat-color"
              value={formColor}
              onChange={(e) => setFormColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border"
            />
            <Input
              value={formColor}
              onChange={(e) => setFormColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-order">{t("admin.catOrder")}</Label>
          <Input
            id="cat-order"
            type="number"
            value={formSortOrder}
            onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {categories.length} {t("admin.categoriesCount")}
        </p>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {t("admin.addCategory")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.newCategory")}</DialogTitle>
            </DialogHeader>
            <CategoryForm isEdit={false} />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t("settings.cancel")}</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={isLoading}>
                {t("admin.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories list */}
      <div className="grid gap-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200 group"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/40" />

            {/* Icon + Color */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: (cat.color || "#3B82F6") + "20" }}
            >
              {cat.icon || "📁"}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{cat.name}</span>
                <Badge variant="outline" className="text-[10px] font-mono">{cat.slug}</Badge>
              </div>
              {cat.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{cat.description}</p>
              )}
            </div>

            {/* Frame count */}
            <Badge variant="secondary" className="text-xs">
              {cat.frame_count} frames
            </Badge>

            {/* Sort order */}
            <span className="text-xs text-muted-foreground w-8 text-center">#{cat.sort_order}</span>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Dialog
                open={editingCategory?.id === cat.id}
                onOpenChange={(open) => {
                  if (open) {
                    setEditingCategory(cat)
                    fillFormFromCategory(cat)
                  } else {
                    setEditingCategory(null)
                    resetForm()
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("admin.editCategory")}</DialogTitle>
                  </DialogHeader>
                  <CategoryForm isEdit={true} />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{t("settings.cancel")}</Button>
                    </DialogClose>
                    <Button onClick={handleUpdate} disabled={isLoading}>
                      {t("admin.save")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("admin.confirmDelete")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("admin.confirmDeleteCatDesc")} &quot;{cat.name}&quot;
                      {cat.frame_count > 0 && (
                        <span className="block mt-2 text-destructive font-medium">
                          ⚠️ {cat.frame_count} frames utilisent cette catégorie.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("settings.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(cat.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("admin.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
