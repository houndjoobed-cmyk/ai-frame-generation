import { createClient } from "@supabase/supabase-js"


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function run() {
  console.log("Checking database for playwright-test@example.com...")
  
  // 1. Get user
  const { data: user, error: userError } = await supabase
    .schema("next_auth")
    .from("users")
    .select("*")
    .eq("email", "playwright-test@example.com")
    .maybeSingle()

  if (userError) {
    console.error("Error fetching user:", userError)
    return
  }

  if (!user) {
    console.log("User playwright-test@example.com not found!")
    return
  }

  console.log("User found:", user)

  // 2. Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("Error fetching profile:", profileError)
  } else {
    console.log("Profile found:", profile)
  }

  // 3. Get payments
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)

  if (paymentsError) {
    console.error("Error fetching payments:", paymentsError)
  } else {
    console.log(`Payments found (${payments.length}):`, payments)
    
    if (payments.length === 0) {
      console.log("No payments found. Inserting a mock completed payment for testing...")
      
      const { data: newPayment, error: insertError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: 5000,
          currency: "XOF",
          provider: "kkiapay",
          provider_reference: "mock-pay-ref-12345",
          status: "completed",
          description: "Abonnement Pro (Test)",
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error inserting mock payment:", insertError)
      } else {
        console.log("Inserted mock payment successfully:", newPayment)
      }
    }
  }
}

run().catch(console.error)
