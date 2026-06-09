import { headers } from "next/headers.js";

export const DEFAULT_AUTH_NEXT_PATH = "/learner";

export function safeNextPath(value: FormDataEntryValue | string | null | undefined): string {
  if (typeof value !== "string") return DEFAULT_AUTH_NEXT_PATH;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_AUTH_NEXT_PATH;
  return value;
}

export async function getSiteOrigin(): Promise<string> {
  const headersList = await headers();
  const explicitOrigin = headersList.get("origin");
  if (explicitOrigin) return explicitOrigin;

  const forwardedHost = headersList.get("x-forwarded-host");
  const host = forwardedHost ?? headersList.get("host");
  if (host) {
    const protocol = headersList.get("x-forwarded-proto") ?? "http";
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
}

export async function getAuthCallbackUrl(nextPath: string): Promise<string> {
  const origin = await getSiteOrigin();
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", safeNextPath(nextPath));
  return url.toString();
}
