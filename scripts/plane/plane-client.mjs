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
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let resolvedProjectId;

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
    const error = new Error(
      `Plane API ${response.status} ${response.statusText}: ${JSON.stringify(body)}`
    );
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

function projectBase() {
  return `/api/v1/workspaces/${encodeURIComponent(workspace())}/projects/${encodeURIComponent(projectId())}`;
}

export async function resolveProjectId() {
  const configured = required("PLANE_PROJECT_ID");
  if (UUID.test(configured)) {
    resolvedProjectId = configured;
    return configured;
  }

  const body = await planeRequest(
    `/api/v1/workspaces/${encodeURIComponent(workspace())}/projects/?per_page=100`
  );
  const projects = Array.isArray(body) ? body : (body?.results ?? []);
  const needle = configured.toLowerCase();
  const match = projects.find((project) =>
    [project.id, project.identifier, project.name].some(
      (value) => String(value ?? "").toLowerCase() === needle
    )
  );

  if (!match) {
    const known = projects.map((project) => `${project.identifier || project.name}`).join(", ") || "none";
    throw new Error(`No Plane project matching "${configured}". Known projects: ${known}`);
  }

  resolvedProjectId = match.id;
  return match.id;
}

export async function getProject() {
  return planeRequest(`${projectBase()}/`);
}

export async function listStates() {
  const body = await planeRequest(`${projectBase()}/states/?per_page=100`);
  if (Array.isArray(body)) return body;
  return body?.results ?? [];
}

export async function createWorkItem(payload) {
  return planeRequest(`${projectBase()}/work-items/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateWorkItem(workItemId, payload) {
  return planeRequest(`${projectBase()}/work-items/${encodeURIComponent(workItemId)}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function workspace() {
  return required("PLANE_WORKSPACE_SLUG");
}

export function projectId() {
  return resolvedProjectId || required("PLANE_PROJECT_ID");
}
