import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { parseSyncArgs, selectTasks } from "./select-tasks.mjs";

function task(id, file, workItemId = "existing") {
  return {
    id,
    file,
    plane: { work_item_id: workItemId, identifier: workItemId ? "MED-1" : null },
  };
}

test("parseSyncArgs accepts task ids and known flags", () => {
  assert.deepEqual(parseSyncArgs(["FE-003", "FE-004"]), {
    dryRun: false,
    changed: false,
    ids: ["FE-003", "FE-004"],
  });
  assert.deepEqual(parseSyncArgs(["--dry-run", "--changed"]), {
    dryRun: true,
    changed: true,
    ids: [],
  });
});

test("parseSyncArgs rejects unknown flags and mixed selectors", () => {
  assert.throws(() => parseSyncArgs(["--force"]), /Unknown option: --force/);
  assert.throws(() => parseSyncArgs(["--changed", "FE-003"]), /not both/);
});

test("selectTasks returns every task when no selector is set", () => {
  const tasks = [task("FE-003", "docs/tasks/frontend/FE-003.md"), task("FE-004", "docs/tasks/frontend/FE-004.md")];
  assert.deepEqual(selectTasks(tasks), tasks);
});

test("selectTasks keeps requested ids and ignores duplicates", () => {
  const tasks = [task("FE-003", "docs/tasks/frontend/FE-003.md"), task("FE-004", "docs/tasks/frontend/FE-004.md")];
  const selected = selectTasks(tasks, { ids: ["FE-004", "FE-004"] });
  assert.deepEqual(
    selected.map((item) => item.id),
    ["FE-004"]
  );
});

test("selectTasks fails before a write when an id is missing", () => {
  const tasks = [task("FE-003", "docs/tasks/frontend/FE-003.md")];
  assert.throws(() => selectTasks(tasks, { ids: ["FE-999"] }), /Unknown task id: FE-999/);
});

test("selectTasks --changed keeps dirty files and tasks that were never linked", () => {
  const tasks = [
    task("FE-003", "docs/tasks/frontend/FE-003.md", "linked"),
    task("FE-004", "docs/tasks/frontend/FE-004.md", "linked"),
    task("FE-005", "docs/tasks/frontend/FE-005.md", null),
  ];
  const selected = selectTasks(tasks, {
    changed: true,
    changedPaths: ["docs/tasks/frontend/FE-003.md"],
  });
  assert.deepEqual(
    selected.map((item) => item.id),
    ["FE-003", "FE-005"]
  );
});

test("selectTasks matches absolute task files to repo-relative git paths", () => {
  const tasks = [
    task("FE-003", path.resolve("docs/tasks/frontend/FE-003.md"), "linked"),
    task("FE-004", path.resolve("docs/tasks/frontend/FE-004.md"), "linked"),
  ];
  const selected = selectTasks(tasks, {
    changed: true,
    changedPaths: ["docs/tasks/frontend/FE-003.md"],
  });
  assert.deepEqual(
    selected.map((item) => item.id),
    ["FE-003"]
  );
});
