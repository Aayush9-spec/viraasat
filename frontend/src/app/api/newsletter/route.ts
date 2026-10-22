import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/core/api/api-response";
import fs from "fs";
import path from "path";

function getFilePath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), "../database/newsletter.json"),
    path.resolve(process.cwd(), "database/newsletter.json"),
    path.resolve("/Users/aayushkumarsingh/Desktop/viraasat/viraasat/database/newsletter.json"),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return possiblePaths[0];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return apiError("Valid email address is required", 400, "INVALID_EMAIL");
    }

    const filePath = getFilePath();
    let subscribers: any[] = [];
    try {
      if (fs.existsSync(filePath)) {
        subscribers = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    } catch (e) {
      subscribers = [];
    }

    const alreadySubscribed = subscribers.some((s) => s.email === email);
    if (!alreadySubscribed) {
      subscribers.unshift({
        id: "sub_" + Date.now(),
        email,
        subscribedAt: new Date().toISOString(),
        discountCodeSent: "VIRAASAT1500",
      });
      try {
        fs.writeFileSync(filePath, JSON.stringify(subscribers, null, 2), "utf8");
      } catch (err) {
        console.warn("Could not write newsletter.json:", err);
      }
    }

    return apiSuccess({
      success: true,
      message: "Welcome to The Viraasat Circle. Your ₹1,500 inaugural credit has been issued.",
      email,
    });
  } catch (err) {
    return handleApiError(err, "Failed to subscribe to newsletter");
  }
}

export async function GET() {
  try {
    const filePath = getFilePath();
    let subscribers = [];
    if (fs.existsSync(filePath)) {
      subscribers = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    return apiSuccess({ subscribers, count: subscribers.length });
  } catch (err) {
    return handleApiError(err, "Failed to fetch subscribers");
  }
}
