/**
 * Push repository task specs to Plane work items.
 *
 * Creates missing items in the project Backlog state. Later runs update title,
 * description, and priority only, so cards moved by hand stay where they are.
 *
 * Usage:
 *   npm run plane:sync
 *   npm run plane:sync:dry
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  createWorkItem,
  getProject,
  listStates,
  projectId,
  resolveProjectId,
  updateWorkItem,
  workspace,
} from "./plane-client.mjs";
import {
  displayIdentifier,
  parseTaskSource,
  workItemContent,
  writePlaneMapping,
} from "./task-format.mjs";

const ROOT = path.resolve("docs/tasks");
const dryRun = process.argv.includes("--dry-run");

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

async function loadTasks() {
  const tasks = [];

  for (const file of await walk(ROOT)) {
    const source = await fs.readFile(file, "utf8");
    const parsed = parseTaskSource(source);
    if (!parsed) continue;
    tasks.push({ file, source, ...parsed.data, ...parsed, id: parsed.data.id, priority: parsed.data.priority });
  }

  return tasks;
}

function backlogStateId(states) {
  if (process.env.PLANE_STATE_ID_BACKLOG) {
    const id = process.env.PLANE_STATE_ID_BACKLOG;
    const match = states.find((state) => state.id === id);
    return { id, name: match?.name || id };
  }

  const backlog = states.filter((state) => state.group === "backlog");
  const chosen =
    backlog.find((state) => state.default) ||
    backlog.find((state) => /^backlog$/i.test(state.name)) ||
    backlog[0];

  if (chosen) return { id: chosen.id, name: chosen.name };

  if (process.env.PLANE_STATE_ID_PLANNED) {
    return { id: process.env.PLANE_STATE_ID_PLANNED, name: "configured planned state" };
  }

  const known = states.map((state) => `${state.name} (${state.group})`).join(", ") || "none";
  throw new Error(
    `No Backlog state found. Set PLANE_STATE_ID_BACKLOG, or add a state in the backlog group. Known states: ${known}`
  );
}

async function persist(task, workItem, projectKey) {
  const identifier = displayIdentifier(projectKey, workItem.sequence_id);
  const next = writePlaneMapping(task.source, workItem.id, identifier);
  if (next !== task.source) {
    await fs.writeFile(task.file, next, "utf8");
    task.source = next;
  }
  return identifier;
}

async function syncTask(task, backlogId) {
  const content = workItemContent(task);
  const existingId = task.plane.work_item_id;

  if (existingId) {
    try {
      const updated = await updateWorkItem(existingId, content);
      return { action: "updated", workItem: updated };
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }

  try {
    const created = await createWorkItem({ ...content, state: backlogId });
    return { action: "created", workItem: created };
  } catch (error) {
    if (error.status === 409 && error.body?.id) {
      const linked = await updateWorkItem(error.body.id, content);
      return { action: "linked", workItem: linked };
    }
    throw error;
  }
}

async function main() {
  const tasks = await loadTasks();
  console.log(`Discovered ${tasks.length} task files.`);

  if (dryRun) {
    console.log("Plane sync: DRY RUN");
    console.log(`Workspace: ${workspace()}`);
    console.log(`Project: ${projectId()}`);
    for (const task of tasks) {
      const action = task.plane.work_item_id ? "update" : "create in Backlog";
      console.log(`- ${task.id}: ${action} (${task.file})`);
    }
    return;
  }

  await resolveProjectId();
  const [project, states] = await Promise.all([getProject(), listStates()]);
  const backlog = backlogStateId(states);
  const projectKey = project.identifier || null;
  console.log(`Backlog state: ${backlog.name}`);

  const counts = { created: 0, updated: 0, linked: 0 };

  for (const task of tasks) {
    const { action, workItem } = await syncTask(task, backlog.id);
    const identifier = await persist(task, workItem, projectKey);
    counts[action] += 1;
    console.log(`${action} ${task.id} → ${identifier || workItem.id}`);
  }

  console.log(
    `Plane sync completed. created ${counts.created}, linked ${counts.linked}, updated ${counts.updated}.`
  );
}

main().catch((error) => {
  const cause = error.cause?.code || error.cause?.message;
  console.error(cause ? `${error.message} (${cause})` : error.message);
  process.exitCode = 1;
});
