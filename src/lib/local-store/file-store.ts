import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DATA_FILE = join(process.cwd(), ".csl-data.json");

export function readStore(): Record<string, unknown[]> {
  if (!existsSync(DATA_FILE)) {
    return {};
  }
  try {
    const raw = readFileSync(DATA_FILE, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown[]>;
    }
    return {};
  } catch {
    return {};
  }
}

export function writeStore(data: Record<string, unknown[]>): void {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function getCollection<T>(name: string): T[] {
  const store = readStore();
  return (store[name] ?? []) as T[];
}

export function upsert<T extends { id: string }>(collection: string, item: T): T {
  const store = readStore();
  const existing = (store[collection] ?? []) as T[];
  const idx = existing.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    existing[idx] = item;
  } else {
    existing.push(item);
  }
  store[collection] = existing;
  writeStore(store);
  return item;
}
