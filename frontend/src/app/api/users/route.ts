import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Next.js runs with cwd = frontend/, so step up to the repo root for the seed DB.
const usersFilePath = path.join(process.cwd(), "..", "database", "users.json");

// Helper to read users
function readUsers() {
  const data = fs.readFileSync(usersFilePath, "utf-8");
  return JSON.parse(data);
}

// Helper to write users
function writeUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// GET - list all users
export function GET() {
  try {
    const users = readUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST - create a new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const users = readUsers();

    // Simple validation
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Assign a new ID (simple incremental approach)
    const maxId = users.length > 0 ? Math.max(...users.map((u) => Number(u.id.split("-")[1]))) : 0;
    const newId = `user-${maxId + 1}`;

    const newUser = {
      id: newId,
      name: body.name,
      email: body.email,
      role: body.role || "user",
      profile: body.profile || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// Item operations (GET/PATCH/DELETE by id) live in [id]/route.ts,
// since only dynamic route segments receive `params`.