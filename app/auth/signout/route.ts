import { revalidatePath } from "next/cache.js";
import { type NextRequest, NextResponse } from "next/server.js";
import { createSupabaseServerClient } from "@/lib/supabase/server.js";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");

  const redirectTo = new URL("/login", request.url);
  redirectTo.searchParams.set("message", "Signed out.");
  return NextResponse.redirect(redirectTo, { status: 303 });
}
