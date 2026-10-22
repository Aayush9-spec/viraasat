import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/services/supabase";
import { apiSuccess, handleApiError } from "@/core/api/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    let query = supabase.from("reviews").select("id, product_id, reviewer_name, rating, comment, created_at");
    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return apiSuccess({
      reviews: data || [],
      count: data ? data.length : 0,
    });
  } catch (err) {
    return handleApiError(err, "Failed to fetch reviews");
  }
}
