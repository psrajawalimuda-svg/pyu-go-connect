import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Schema = z.object({ driver_id: z.string().uuid() });

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

    // Verify the caller is the driver
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

    const { driver_id } = parsed.data;

    // Verify driver belongs to this user
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

    // Get all pending earnings
    const { data: pendingEarnings, error: earnErr } = await supabase
      .from("driver_earnings")
      .select("*")
      .eq("driver_id", driver_id)
      .eq("status", "pending");

    if (earnErr) throw earnErr;

    if (!pendingEarnings?.length) {
      return new Response(JSON.stringify({ error: "Tidak ada pendapatan pending untuk ditarik" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalWithdraw = pendingEarnings.reduce((s, e) => s + Number(e.net_earning), 0);

    // Get or create driver wallet
    let { data: wallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", driver.user_id!)
      .eq("wallet_type", "driver")
      .maybeSingle();

    if (!wallet) {
      const { data: nw } = await supabase
        .from("wallets")
        .insert({ user_id: driver.user_id!, wallet_type: "driver" })
        .select("id")
        .single();
      wallet = nw;
    }

    if (!wallet) {
      return new Response(JSON.stringify({ error: "Gagal membuat wallet" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process wallet transaction
    await supabase.rpc("process_wallet_transaction", {
      p_wallet_id: wallet.id,
      p_type: "ride_earning",
      p_amount: totalWithdraw,
      p_description: `Withdraw ${pendingEarnings.length} ride earnings`,
    });

    // Mark all as paid
    const earningIds = pendingEarnings.map((e) => e.id);
    await supabase
      .from("driver_earnings")
      .update({ status: "paid" })
      .in("id", earningIds);

    return new Response(JSON.stringify({
      success: true,
      amount: totalWithdraw,
      earnings_count: pendingEarnings.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("withdraw-earnings error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
