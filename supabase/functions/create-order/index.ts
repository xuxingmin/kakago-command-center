import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface CreateOrderRequest {
  store_id: string;
  items: OrderItem[];
  customer_phone?: string;
  customer_name?: string;
  notes?: string;
}

// 生成订单号
function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `KK${dateStr}${timeStr}${random}`;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CreateOrderRequest = await req.json();
    console.log("Creating order:", body);

    // 验证必填字段
    if (!body.store_id || !body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "store_id and items are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 验证门店存在
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, status")
      .eq("id", body.store_id)
      .single();

    if (storeError || !store) {
      console.error("Store not found:", storeError);
      return new Response(
        JSON.stringify({ error: "Store not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 计算订单总金额
    const totalAmount = body.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 创建订单
    const orderNo = generateOrderNo();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        store_id: body.store_id,
        items: body.items,
        total_amount: totalAmount,
        customer_phone: body.customer_phone || null,
        customer_name: body.customer_name || null,
        notes: body.notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Failed to create order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order", details: orderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order created successfully:", order);

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_no: order.order_no,
          store_name: store.name,
          total_amount: order.total_amount,
          status: order.status,
          created_at: order.created_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
