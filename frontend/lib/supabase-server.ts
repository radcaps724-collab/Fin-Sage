import { createClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api-errors";

export const getSupabaseServer = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new ApiError(
      "Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      500,
      "CONFIG_ERROR"
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
