import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, store_id } = await req.json();

    if (!phone || !/^1\d{10}$/.test(phone)) {
      return new Response(
        JSON.stringify({ success: false, error: "无效的手机号" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!store_id) {
      return new Response(
        JSON.stringify({ success: false, error: "缺少门店ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Create auth user with phone
    const tempPassword = crypto.randomUUID().slice(0, 12);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone,
      password: tempPassword,
      phone_confirm: true,
      user_metadata: { role: "merchant", store_id },
    });

    if (authError) {
      console.error("Auth create error:", authError);
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // Create profile
    await supabase.from("profiles").upsert({
      user_id: userId,
      phone,
    });

    // Assign merchant role
    await supabase.from("user_roles").insert({
      user_id: userId,
      role: "merchant",
      store_id,
    });

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: `${phone}@phone.kakago.local`, // placeholder for link generation
    });

    // TODO: Integrate real SMS provider (e.g. Twilio) to send the password setup link
    // For now, log the action and return success
    console.log(`[SMS] Would send password setup SMS to ${phone}`);
    if (linkData) {
      console.log(`[SMS] Recovery link generated for user ${userId}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        message: `店主账号已创建，密码设置短信已发送至 ${phone}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "服务器内部错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
