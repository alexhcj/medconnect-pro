/**
 * Choose which repository tasks a Plane sync run should touch.
 * Kept free of HTTP so selection rules can be tested without a workspace.
 */

import { execFileSync } from "node:child_process";
import path from "node:path";

const FLAGS = new Set(["--dry-run", "--changed"]);

export function parseSyncArgs(argv) {
  const flags = [];
  const ids = [];

  for (const arg of argv) {
    if (arg.startsWith("--")) {
      if (!FLAGS.has(arg)) throw new Error(`Unknown option: ${arg}`);
      flags.push(arg);
      continue;
    }
    if (arg) ids.push(arg);
  }

  const changed = flags.includes("--changed");
  if (changed && ids.length > 0) {
    throw new Error("Pass task ids or --changed, not both.");
  }

  return {
    dryRun: flags.includes("--dry-run"),
    changed,
    ids,
  };
}

export function normalizeRepoPath(file, cwd = process.cwd()) {
  const relative = path.isAbsolute(file) ? path.relative(cwd, file) : file;
  return relative.split(path.sep).join("/");
}

export function changedTaskPaths(cwd = process.cwd()) {
  const diff = gitLines(cwd, ["diff", "--name-only", "--diff-filter=ACMR", "HEAD", "--", "docs/tasks"]);
  const untracked = gitLines(cwd, ["ls-files", "--others", "--exclude-standard", "--", "docs/tasks"]);
  return [...new Set([...diff, ...untracked])];
}

function gitLines(cwd, args) {
  let output;
  try {
    output = execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    throw new Error(`Could not list changed task files. ${detail}`);
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function selectTasks(tasks, { ids = [], changed = false, changedPaths = [], cwd = process.cwd() } = {}) {
  if (ids.length > 0) {
    const byId = new Map();
    for (const task of tasks) {
      if (byId.has(task.id)) throw new Error(`Duplicate task id: ${task.id}`);
      byId.set(task.id, task);
    }

    const missing = [];
    const selected = [];
    const seen = new Set();
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const task = byId.get(id);
      if (!task) missing.push(id);
      else selected.push(task);
    }

    if (missing.length > 0) {
      throw new Error(`Unknown task id: ${missing.join(", ")}`);
    }
    return selected;
  }

  if (!changed) return tasks;

  const dirty = new Set(changedPaths.map((file) => normalizeRepoPath(file, cwd)));
  return tasks.filter(
    (task) => !task.plane.work_item_id || dirty.has(normalizeRepoPath(task.file, cwd))
  );
}
