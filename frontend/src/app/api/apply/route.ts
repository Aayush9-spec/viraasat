import { NextRequest, NextResponse } from "next/server";
import { database, identity, failure, HttpError } from '@/lib/server/security';
import { apiSuccess, apiError, handleApiError } from "@/core/api/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await identity();
    const supabase = database();
    const body = await req.json().catch(() => ({}));
    const { fullName, workshopName, email, phone, pincode, state, craft, notes } = body;

    if (!fullName || !email) {
      return apiError("Full name and email are required", 400, "MISSING_REQUIRED_FIELDS");
    }

    const applicationRecord = {
      applicant_id: user.id,
      full_name: String(fullName).trim(),
      workshop_name: String(workshopName || fullName + " Atelier").trim(),
      email: user.email,
      phone: String(phone || "").trim(),
      pincode: String(pincode || "000000").trim(),
      state: String(state || "India").trim(),
      craft: String(craft || "Traditional Handicrafts").trim(),
      status: "pending",
    };

    const { data, error } = await supabase
      .from("artisan_applications")
      .insert([applicationRecord])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error in artisan_applications:", error);
      throw error;
    }

    return apiSuccess({
      success: true,
      message: "Application submitted successfully to Viraasat Artisan Guild.",
      application: data,
    });
  } catch (err) {
    return handleApiError(err, "Failed to submit artisan application");
  }
}

export async function GET() {
  try {
    const user = await identity();
    if(user.role !== "admin") throw new HttpError(403,"Administrator access required");
    const supabase = database();
    const { data, error } = await supabase
      .from("artisan_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return apiSuccess({ applications: data || [], total: data ? data.length : 0 });
  } catch (err) {
    return failure(err);
  }
}
