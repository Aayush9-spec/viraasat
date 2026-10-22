import { NextResponse } from "next/server";
import { supabase } from "@/services/supabase";
import { apiSuccess, handleApiError } from "@/core/api/api-response";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, display_name, bio, avatar_url, region, role")
      .eq("role", "artisan");

    if (error) throw error;

    // Transform into clean artisan objects
    const artisans = (data || []).map((u) => ({
      id: u.id,
      name: u.display_name,
      email: u.email,
      bio: u.bio,
      avatarUrl: u.avatar_url,
      region: u.region || "India",
      role: u.role,
    }));

    return apiSuccess({ artisans, count: artisans.length });
  } catch (err) {
    return handleApiError(err, "Failed to fetch artisans");
  }
}
