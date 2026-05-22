// ============================================
// Database types for Digital Frames AI
// ============================================

// --- Auth & User ---

export interface User {
  id: string
  name: string | null
  email: string | null
  emailVerified: Date | null
  image: string | null
}

export type UserRole = "user" | "creator" | "admin" | "super_admin"

export interface Profile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
  country: string | null
  role: UserRole
  is_verified: boolean
  created_at: string
  updated_at: string
}

// --- Categories ---

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

// --- Frames ---

export type FileFormat = "png" | "jpg" | "svg" | "webp"

export interface Frame {
  id: string
  name: string
  description: string | null
  image_url: string
  thumbnail_url: string | null
  category_id: string | null
  tags: string[]
  is_premium: boolean
  is_public: boolean
  is_active: boolean
  download_count: number
  like_count: number
  created_by: string | null
  width: number | null
  height: number | null
  file_size: number | null
  file_format: FileFormat | null
  created_at: string
  updated_at: string
  // Joined fields
  category?: Category
  is_liked?: boolean
  is_favorited?: boolean
  creator?: Profile
}

export interface FrameLike {
  id: string
  user_id: string
  frame_id: string
  created_at: string
}

export interface UserFavorite {
  id: string
  user_id: string
  frame_id: string
  created_at: string
}

// --- Projects ---

export type ProjectStatus = "draft" | "published" | "archived"

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  canvas_data: CanvasData | null
  canvas_width: number
  canvas_height: number
  is_public: boolean
  status: ProjectStatus
  created_at: string
  updated_at: string
  // Joined fields
  frames?: Frame[]
  export_count?: number
}

export interface ProjectFrame {
  id: string
  project_id: string
  frame_id: string
  layer_order: number
  created_at: string
}

// --- AI Generations ---

export type AIGenerationStatus = "pending" | "processing" | "completed" | "failed"

export interface AIGeneration {
  id: string
  user_id: string
  prompt: string
  negative_prompt: string | null
  generated_image_url: string | null
  model: string
  style: string | null
  status: AIGenerationStatus
  error_message: string | null
  credits_used: number
  generation_params: Record<string, unknown> | null
  created_at: string
  completed_at: string | null
}

export interface AICredits {
  id: string
  user_id: string
  total_credits: number
  used_credits: number
  remaining_credits?: number // computed
  last_refill_at: string
  created_at: string
  updated_at: string
}

// --- Subscriptions & Payments ---

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly: number
  price_yearly: number
  currency: string
  features: string[]
  max_exports_per_month: number | null
  max_ai_credits_per_month: number | null
  max_storage_mb: number | null
  has_hd_export: boolean
  has_premium_frames: boolean
  has_ai_generation: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due"
export type PaymentProvider = "stripe" | "kkiapay" | "fedapay" | "mobile_money"

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  status: SubscriptionStatus
  payment_provider: PaymentProvider | null
  payment_reference: string | null
  current_period_start: string
  current_period_end: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  // Joined
  plan?: SubscriptionPlan
}

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

export interface Payment {
  id: string
  user_id: string
  subscription_id: string | null
  amount: number
  currency: string
  provider: PaymentProvider
  provider_reference: string | null
  status: PaymentStatus
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// --- Exports ---

export type ExportFormat = "png" | "jpg" | "webp" | "gif" | "mp4"
export type ExportPreset = "square" | "story" | "tiktok" | "custom"
export type ExportQuality = "standard" | "hd" | "ultra_hd"
export type ExportStatus = "pending" | "processing" | "completed" | "failed"

export interface Export {
  id: string
  user_id: string
  project_id: string | null
  file_url: string | null
  file_format: ExportFormat
  export_preset: ExportPreset | null
  width: number | null
  height: number | null
  quality: ExportQuality
  file_size: number | null
  status: ExportStatus
  created_at: string
}

// --- Notifications ---

export type NotificationType = "info" | "success" | "warning" | "error" | "system"
export type NotificationCategory = "general" | "export" | "ai" | "subscription" | "system"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  is_read: boolean
  action_url: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// --- Canvas (Fabric.js) ---

export interface CanvasData {
  version: string
  objects: FabricObject[]
  background?: string
  width: number
  height: number
}

export interface FabricObject {
  type: string
  version: string
  originX: string
  originY: string
  left: number
  top: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  angle: number
  flipX: boolean
  flipY: boolean
  opacity: number
  visible: boolean
  src?: string
  text?: string
  fontSize?: number
  fontFamily?: string
  fill?: string
  [key: string]: unknown
}
