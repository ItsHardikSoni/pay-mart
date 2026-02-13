
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { 
    p_order_number, 
    p_username, 
    p_total_amount, 
    p_cart_items, 
    p_payment_mode, 
    p_order_time, 
    p_order_date, 
    p_razorpay_payment_id, 
    p_cashier_name, 
    p_razorpay_signature 
  } = await req.json();

  const { error } = await supabase.rpc('process_new_order', {
    p_order_number,
    p_username,
    p_total_amount,
    p_cart_items,
    p_payment_mode,
    p_order_time,
    p_order_date,
    p_razorpay_payment_id,
    p_cashier_name,
    p_razorpay_signature
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
