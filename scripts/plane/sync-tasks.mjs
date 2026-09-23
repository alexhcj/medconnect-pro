/**
 * Push repository task specs to Plane work items.
 *
 * Creates missing items in the project Backlog state. Later runs update title,
 * description, and priority only, so cards moved by hand stay where they are.
 *
 * Usage:
 *   npm run plane:sync
 *   npm run plane:sync:dry
 *   npm run plane:sync -- FE-003
 *   npm run plane:sync -- --changed
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
import { changedTaskPaths, parseSyncArgs, selectTasks } from "./select-tasks.mjs";
import {
  displayIdentifier,
  parseTaskSource,
  workItemContent,
  writePlaneMapping,
} from "./task-format.mjs";

const ROOT = path.resolve("docs/tasks");

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

function backlogResolver() {
  let pending;
  return () => {
    pending ??= listStates().then((states) => {
      const backlog = backlogStateId(states);
      console.log(`Backlog state: ${backlog.name}`);
      return backlog.id;
    });
    return pending;
  };
}

async function syncTask(task, resolveBacklogId) {
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
    const created = await createWorkItem({ ...content, state: await resolveBacklogId() });
    return { action: "created", workItem: created };
  } catch (error) {
    if (error.status === 409 && error.body?.id) {
      const linked = await updateWorkItem(error.body.id, content);
      return { action: "linked", workItem: linked };
    }
    throw error;
  }
}

function tasksToSync(tasks, syncArgs) {
  const changedPaths = syncArgs.changed ? changedTaskPaths() : [];
  return selectTasks(tasks, {
    ids: syncArgs.ids,
    changed: syncArgs.changed,
    changedPaths,
  });
}

async function main() {
  const syncArgs = parseSyncArgs(process.argv.slice(2));
  const tasks = await loadTasks();
  const selected = tasksToSync(tasks, syncArgs);
  console.log(`Discovered ${tasks.length} task files; selected ${selected.length}.`);

  if (syncArgs.dryRun) {
    console.log("Plane sync: DRY RUN");
    console.log(`Workspace: ${workspace()}`);
    console.log(`Project: ${projectId()}`);
    for (const task of selected) {
      const action = task.plane.work_item_id ? "update" : "create in Backlog";
      console.log(`- ${task.id}: ${action} (${task.file})`);
    }
    return;
  }

  if (selected.length === 0) {
    console.log("No tasks to sync.");
    return;
  }

  await resolveProjectId();
  const project = await getProject();
  const projectKey = project.identifier || null;
  const resolveBacklogId = backlogResolver();

  const counts = { created: 0, updated: 0, linked: 0 };

  for (const task of selected) {
    const { action, workItem } = await syncTask(task, resolveBacklogId);
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
