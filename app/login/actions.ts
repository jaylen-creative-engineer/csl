"use server";

import { revalidatePath } from "next/cache.js";
import { redirect } from "next/navigation.js";
import { z } from "zod";
import { getAuthCallbackUrl, safeNextPath } from "@/lib/auth/redirect.js";
import { createSupabaseServerClient } from "@/lib/supabase/server.js";

const EmailOnly = z.object({
  email: z.string().trim().email(),
  next: z.string().optional(),
});

const Credentials = EmailOnly.extend({
  password: z.string().min(8),
});

function loginPath(params: Record<string, string | undefined>): string {
  const url = new URL("http://local/login");
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export async function signInWithPassword(formData: FormData) {
  const parsed = Credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  const next = safeNextPath(formData.get("next"));

  if (!parsed.success) {
    redirect(loginPath({ error: "Enter a valid email and password.", next }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(loginPath({ error: error.message, next }));
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpWithPassword(formData: FormData) {
  const parsed = Credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  const next = safeNextPath(formData.get("next"));

  if (!parsed.success) {
    redirect(loginPath({ error: "Enter a valid email and an 8+ character password.", next }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: await getAuthCallbackUrl(next),
    },
  });

  if (error) {
    redirect(loginPath({ error: error.message, next }));
  }

  revalidatePath("/", "layout");
  redirect(
    loginPath({
      message: "Account created. Check your email if confirmation is enabled.",
      next,
    })
  );
}

export async function sendMagicLink(formData: FormData) {
  const parsed = EmailOnly.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
  const next = safeNextPath(formData.get("next"));

  if (!parsed.success) {
    redirect(loginPath({ error: "Enter a valid email address.", next }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: await getAuthCallbackUrl(next),
    },
  });

  if (error) {
    redirect(loginPath({ error: error.message, next }));
  }

  redirect(
    loginPath({
      message: "Check your email for a sign-in link.",
      next,
    })
  );
}
