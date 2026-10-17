import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Magic-link landing: exchanges the PKCE code for a session, then continues.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/play";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/play";
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent("That link did not work in this browser. Use the 6-digit code from the email instead.")}`, url.origin));
    }
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
