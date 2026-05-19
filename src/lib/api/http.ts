import { NextResponse } from "next/server.js";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true as const, data }, { status: 200, ...init });
}

export function jsonCreated<T>(data: T): NextResponse {
  return NextResponse.json({ ok: true as const, data }, { status: 201 });
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false as const, error: message }, { status });
}

export async function readJsonBody<T>(request: Request): Promise<T | undefined> {
  try {
    return (await request.json()) as T;
  } catch {
    return undefined;
  }
}
