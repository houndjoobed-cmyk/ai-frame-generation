import { z } from "zod"

// ============================================
// Auth Schemas
// ============================================

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .trim(),
  email: z
    .string()
    .email("Adresse e-mail invalide")
    .max(255, "L'adresse e-mail est trop longue")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe ne doit pas dépasser 128 caractères"),
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Adresse e-mail invalide")
    .max(255)
    .toLowerCase()
    .trim(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe ne doit pas dépasser 128 caractères"),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token requis"),
  email: z
    .string()
    .email("Adresse e-mail invalide")
    .toLowerCase()
    .trim(),
})

// ============================================
// Frame Schemas
// ============================================

export const createFrameSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du cadre est requis")
    .max(200, "Le nom est trop long"),
  description: z
    .string()
    .max(2000, "La description est trop longue")
    .nullable()
    .optional(),
  categoryId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  base64Image: z
    .string()
    .min(1, "L'image du cadre est requise"),
  isPublic: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
})

// ============================================
// Project Schemas
// ============================================

export const createProjectSchema = z.object({
  name: z
    .string()
    .max(200, "Le nom est trop long")
    .optional()
    .default("Projet sans nom"),
  canvasData: z.unknown().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  canvasWidth: z.number().int().min(1).max(8192).optional().default(800),
  canvasHeight: z.number().int().min(1).max(8192).optional().default(800),
})

export const updateProjectSchema = z.object({
  id: z.string().uuid("ID du projet invalide"),
  name: z
    .string()
    .max(200, "Le nom est trop long")
    .optional()
    .default("Projet sans nom"),
  canvasData: z.unknown().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  canvasWidth: z.number().int().min(1).max(8192).optional(),
  canvasHeight: z.number().int().min(1).max(8192).optional(),
})

// ============================================
// Export Schemas
// ============================================

export const createExportSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  width: z.number().int().min(1).max(8192).optional().default(1080),
  height: z.number().int().min(1).max(8192).optional().default(1080),
  fileFormat: z
    .enum(["png", "jpg", "webp", "gif", "mp4"])
    .optional()
    .default("png"),
  exportPreset: z
    .enum(["square", "story", "tiktok", "custom"])
    .optional()
    .default("square"),
})

// ============================================
// Like Schemas
// ============================================

export const likeFrameSchema = z.object({
  frameId: z.string().uuid("ID du cadre invalide"),
})

// ============================================
// AI Generation Schemas
// ============================================

export const aiGenerateSchema = z.object({
  prompt: z
    .string()
    .min(3, "Le prompt doit contenir au moins 3 caractères")
    .max(2000, "Le prompt est trop long"),
  negativePrompt: z
    .string()
    .max(1000, "Le prompt négatif est trop long")
    .optional()
    .default(""),
  style: z
    .enum(["standard", "festive", "elegant", "cartoon", "neon"])
    .optional()
    .default("standard"),
})

// ============================================
// Share Schemas
// ============================================

export const shareSchema = z.object({
  base64Image: z.string().min(1, "Image manquante"),
  projectId: z.string().uuid().nullable().optional(),
  exportPreset: z
    .enum(["square", "story", "tiktok", "custom"])
    .optional()
    .default("square"),
  width: z.number().int().min(1).max(8192).optional().default(800),
  height: z.number().int().min(1).max(8192).optional().default(800),
})

// ============================================
// Notification Schemas
// ============================================

export const updateNotificationSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAllRead: z.boolean().optional(),
}).refine(
  (data) => data.notificationId || data.markAllRead,
  { message: "notificationId ou markAllRead est requis" }
)

// ============================================
// Custom Order Schemas
// ============================================

export const createCustomOrderSchema = z.object({
  eventName: z.string().min(3, "Le nom de l'événement doit contenir au moins 3 caractères").max(200),
  eventDate: z.string().optional().nullable(),
  eventType: z.enum(["birthday", "wedding", "holiday", "graduation", "corporate", "social", "other"]),
  description: z.string().min(10, "Veuillez fournir une description détaillée d'au moins 10 caractères").max(3000),
  referenceImageUrl: z.string().url("URL de l'image de référence invalide").optional().nullable(),
  referenceImageBase64: z.string().optional().nullable(),
  budget: z.number().positive("Le budget doit être un nombre positif").optional().nullable(),
})

export const updateCustomOrderStatusSchema = z.object({
  orderId: z.string().uuid("ID de commande invalide"),
  status: z.enum(["pending", "awaiting_payment", "in_progress", "completed", "cancelled"]),
  designerNotes: z.string().max(2000).optional().nullable(),
  completedFrameUrl: z.string().url("URL du cadre finalisé invalide").optional().nullable(),
  completedFrameBase64: z.string().optional().nullable(),
  budget: z.number().positive("Le budget doit être un nombre positif").optional().nullable(),
})

