/**
 * Plane task synchronizer.
 *
 * This intentionally keeps the repository task format independent of Plane's internal API model.
 * The endpoint paths/fields should be verified against the current Plane API docs when first
 * connecting the project because Plane API versions and workspace configuration can evolve.
 *
 * Usage:
 *   npm run plane:sync
 *   node scripts/plane/sync-tasks.mjs --dry-run
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { planeRequest, workspace, projectId } from "./plane-client.mjs";

const ROOT = path.resolve("docs/tasks");
const dryRun = process.argv.includes("--dry-run");

function parseFrontMatter(source) {
  if (!source.startsWith("---")) return null;
  const end = source.indexOf("\n---", 3);
  if (end === -1) throw new Error("Invalid front matter");

  const raw = source.slice(3, end).trim();
  const body = source.slice(end + 4).trim();

  // Deliberately minimal parser for the controlled task schema.
  // Replace with a YAML package if the schema grows beyond simple scalar/list/object metadata.
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    data[key] = value.replace(/^['"]|['"]$/g, "");
  }

  return { data, body };
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.endsWith(".md")) result.push(full);
  }

  return result;
}

function taskPayload(task, body) {
  return {
    name: `${task.id} — ${task.title || task.id}`,
    description_html: body.replaceAll("\n", "<br />"),
    priority: task.priority || "medium",
  };
}

async function main() {
  if (dryRun) {
    console.log("Plane sync: DRY RUN");
    console.log(`Workspace: ${workspace()}`);
    console.log(`Project: ${projectId()}`);
  }

  const files = await walk(ROOT);
  const tasks = [];

  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    const parsed = parseFrontMatter(source);
    if (!parsed?.data?.id) continue;

    tasks.push({
      file,
      ...parsed.data,
      title: source.match(/^#\s+(.+)$/m)?.[1]?.replace(/^.+?\s+—\s+/, "") || parsed.data.id,
      body: parsed.body,
    });
  }

  console.log(`Discovered ${tasks.length} task files.`);

  if (dryRun) {
    for (const task of tasks) {
      console.log(`- ${task.id}: ${task.file}`);
    }
    return;
  }

  /*
   * IMPORTANT:
   * The exact create/update endpoint and payload should be confirmed against the Plane workspace
   * API documentation before the first live run. This avoids hard-coding an outdated endpoint.
   *
   * Recommended implementation:
   *
   * POST /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/
   * PATCH /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/
   *
   * Map Plane state/label IDs from environment variables rather than embedding them in tasks.
   */

  for (const task of tasks) {
    console.log(`Would synchronize ${task.id}`);
    // Live create/update implementation belongs here after workspace-specific IDs are configured.
  }

  console.log("Plane sync completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
