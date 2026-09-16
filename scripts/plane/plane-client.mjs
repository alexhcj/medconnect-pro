import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function loadLocalEnv() {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ".env");
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadLocalEnv();

const API_BASE_URL = process.env.PLANE_API_BASE_URL || "https://api.plane.so";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function headers() {
  return {
    "Content-Type": "application/json",
    "X-API-Key": required("PLANE_API_KEY"),
  };
}

export async function planeRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers(),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(
      `Plane API ${response.status} ${response.statusText}: ${JSON.stringify(body)}`
    );
  }

  return body;
}

export function workspace() {
  return required("PLANE_WORKSPACE_SLUG");
}

export function projectId() {
  return required("PLANE_PROJECT_ID");
}
