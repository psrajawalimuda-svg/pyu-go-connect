import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Schema = z.object({
  driver_id: z.string().uuid(),
  bank_account_id: z.string().uuid(),
  amount: z.number().positive().min(10000, "Minimum penarikan Rp 10.000"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { driver_id, bank_account_id, amount } = parsed.data;

    // Verify driver belongs to user
    const { data: driver } = await supabase
      .from("drivers")
      .select("id, user_id")
      .eq("id", driver_id)
      .single();

    if (!driver || driver.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Driver not found or unauthorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify bank account belongs to driver
    const { data: bankAccount } = await supabase
      .from("driver_bank_accounts")
      .select("id, bank_name, account_number, account_holder")
      .eq("id", bank_account_id)
      .eq("driver_id", driver_id)
      .single();

    if (!bankAccount) {
      return new Response(JSON.stringify({ error: "Rekening bank tidak ditemukan" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check driver wallet balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", driver.user_id!)
      .eq("wallet_type", "driver")
      .single();

    if (!wallet || Number(wallet.balance) < amount) {
      return new Response(JSON.stringify({ error: "Saldo wallet tidak mencukupi" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for pending withdrawal
    const { data: pendingReq } = await supabase
      .from("withdrawal_requests")
      .select("id")
      .eq("driver_id", driver_id)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingReq) {
      return new Response(JSON.stringify({ error: "Masih ada permintaan penarikan yang sedang diproses" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct from wallet
    await supabase.rpc("process_wallet_transaction", {
      p_wallet_id: wallet.id,
      p_type: "withdrawal",
      p_amount: -amount,
      p_description: `Penarikan ke ${bankAccount.bank_name} ${bankAccount.account_number}`,
    });

    // Create withdrawal request
    const { data: withdrawal, error: wErr } = await supabase
      .from("withdrawal_requests")
      .insert({
        driver_id,
        bank_account_id,
        amount,
        status: "pending",
      })
      .select("id")
      .single();

    if (wErr) throw wErr;

    return new Response(JSON.stringify({
      success: true,
      withdrawal_id: withdrawal!.id,
      amount,
      bank: `${bankAccount.bank_name} - ${bankAccount.account_number} (${bankAccount.account_holder})`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("withdraw-to-bank error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
