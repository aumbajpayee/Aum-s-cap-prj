import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Delete the session cookie
    cookieStore.set("appwrite-session", "", {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
