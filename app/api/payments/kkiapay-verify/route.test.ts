import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { POST } from "./route"
import { NextResponse } from "next/server"

// Mock Supabase admin client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
  then: vi.fn((onfulfilled) => {
    return Promise.resolve({ data: null, error: null }).then(onfulfilled)
  }),
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockSupabase,
}))

describe("POST /api/payments/kkiapay-verify", () => {
  let originalEnv: NodeJS.ProcessEnv
  let fetchMock = vi.fn()

  beforeEach(() => {
    originalEnv = { ...process.env }
    process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY = "pk_test"
    process.env.KKIAPAY_PRIVATE_KEY = "tpk_test"
    process.env.KKIAPAY_SECRET_KEY = "sk_test"
    
    global.fetch = fetchMock
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("should return 400 if transactionId is missing", async () => {
    const request = new Request("http://localhost/api/payments/kkiapay-verify", {
      method: "POST",
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toContain("Transaction ID is required")
  })

  it("should return 500 if KkiaPay API keys are not configured", async () => {
    delete process.env.KKIAPAY_PRIVATE_KEY

    const request = new Request("http://localhost/api/payments/kkiapay-verify", {
      method: "POST",
      body: JSON.stringify({ transactionId: "tx_123" }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.error).toContain("Payment service is not configured")
  })

  it("should return 502 if Kkiapay API returns non-ok status", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("Internal Server Error"),
    })

    const request = new Request("http://localhost/api/payments/kkiapay-verify", {
      method: "POST",
      body: JSON.stringify({ transactionId: "tx_123" }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json.success).toBe(false)
    expect(json.error).toContain("Failed to communicate with Kkiapay API")
  })

  it("should return 400 if transaction is not successful", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: "FAILED",
      }),
    })

    const request = new Request("http://localhost/api/payments/kkiapay-verify", {
      method: "POST",
      body: JSON.stringify({ transactionId: "tx_123" }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toContain("Transaction is not successful")
  })

  it("should return 400 if metadata is missing or invalid", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: "SUCCESS",
        state: "{}", // empty metadata
      }),
    })

    const request = new Request("http://localhost/api/payments/kkiapay-verify", {
      method: "POST",
      body: JSON.stringify({ transactionId: "tx_123" }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toContain("Invalid or missing transaction metadata")
  })

  it("should succeed, update subscription and credits, and return SUCCESS status", async () => {
    // 1. Mock Kkiapay success response with metadata
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: "SUCCESS",
        amount: 2990,
        currency: "XOF",
        state: JSON.stringify({
          userId: "user_test_123",
          planId: "pro",
          isAnnual: false,
        }),
      }),
    })

    // 2. Mock database calls
    // Fetch plan details
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: {
        id: "5dbd986d-89fa-43dd-bd21-13eb6790e276",
        name: "Pro",
        max_ai_credits_per_month: 50,
        price_monthly: 2990,
        currency: "XOF",
      },
      error: null,
    })

    // Check existing active subscription (returns null, meaning first time subscription)
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    // Insert new user subscription
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "sub_test_999",
      },
      error: null,
    })



    const request = new Request("http://localhost/api/payments/kkiapay-verify", {
      method: "POST",
      body: JSON.stringify({ transactionId: "tx_123" }),
    })

    const response = await POST(request)
    const json = await response.json()

    // 3. Verify asserts
    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.status).toBe("SUCCESS")

    // Check database mock interactions
    expect(mockSupabase.from).toHaveBeenCalledWith("subscription_plans")
    expect(mockSupabase.from).toHaveBeenCalledWith("user_subscriptions")
    expect(mockSupabase.from).toHaveBeenCalledWith("payments")
    expect(mockSupabase.from).toHaveBeenCalledWith("ai_credits")

    // Check user subscription insertion arguments
    expect(mockSupabase.insert).toHaveBeenNthCalledWith(1, expect.objectContaining({
      user_id: "user_test_123",
      plan_id: "5dbd986d-89fa-43dd-bd21-13eb6790e276",
      status: "active",
      payment_provider: "kkiapay",
      payment_reference: "tx_123",
    }))

    // Check payment recording arguments
    expect(mockSupabase.insert).toHaveBeenNthCalledWith(2, {
      user_id: "user_test_123",
      subscription_id: "sub_test_999",
      amount: 2990,
      currency: "XOF",
      provider: "kkiapay",
      provider_reference: "tx_123",
      status: "completed",
      description: "Abonnement au forfait Pro",
      metadata: {
        kkiapay_transaction_id: "tx_123",
        plan_id: "5dbd986d-89fa-43dd-bd21-13eb6790e276",
        is_annual: false,
      },
    })

    // Check credits refilling arguments
    expect(mockSupabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_test_123",
        total_credits: 50,
        used_credits: 0,
      }),
      { onConflict: "user_id" }
    )
  })
})
