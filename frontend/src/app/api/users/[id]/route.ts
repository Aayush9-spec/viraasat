import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Next.js runs with cwd = frontend/, so step up to the repo root for the seed DB.
const usersFilePath = path.join(process.cwd(), "..", "database", "users.json");

function readUsers() {
  const data = fs.readFileSync(usersFilePath, "utf-8");
  return JSON.parse(data);
}

function writeUsers(users: unknown[]) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// GET - fetch a single user by id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const users = readUsers();
    const user = users.find((u: { id: string }) => u.id === id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PATCH - update a user
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const users = readUsers();
    const index = users.findIndex((u: { id: string }) => u.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    users[index] = { ...users[index], ...body, updatedAt: new Date().toISOString() };
    writeUsers(users);
    return NextResponse.json(users[index]);
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE - remove a user
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const users = readUsers();
    const index = users.findIndex((u: { id: string }) => u.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    users.splice(index, 1);
    writeUsers(users);
    return NextResponse.json({ message: "User deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
