/**
 * Task-file parsing and Plane work-item payload mapping.
 * Kept free of HTTP so the sync rules can be tested without a workspace.
 */

export const EXTERNAL_SOURCE = "medconnect-tasks";

const PRIORITY = {
  critical: "urgent",
  urgent: "urgent",
  high: "high",
  medium: "medium",
  low: "low",
  none: "none",
};

function scalar(value) {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  if (trimmed === "" || trimmed === "null" || trimmed === "~") return null;
  return trimmed;
}

function parsePlaneBlock(raw) {
  const match = raw.match(/^plane:[ \t]*\r?\n((?:[ \t]+[^\n]*\r?\n?)*)/m);
  const plane = { work_item_id: null, identifier: null };
  if (!match) return plane;

  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^[ \t]+([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;
    plane[field[1]] = scalar(field[2]);
  }

  return plane;
}

export function parseTaskSource(source) {
  if (!source.startsWith("---")) return null;
  const end = source.indexOf("\n---", 3);
  if (end === -1) throw new Error("Invalid front matter");

  const raw = source.slice(3, end).trim();
  const body = source.slice(end + 4).trim();
  const data = {};

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    data[match[1]] = scalar(match[2]) ?? "";
  }

  if (!data.id) return null;

  const heading = source.match(/^#\s+(.+)$/m)?.[1] ?? data.id;
  const title = heading.replace(/^.+?\s+—\s+/, "") || data.id;

  return {
    data,
    plane: parsePlaneBlock(raw),
    title,
    body,
  };
}

export function planePriority(value) {
  const key = (value || "medium").trim().toLowerCase();
  const mapped = PRIORITY[key];
  if (!mapped) {
    throw new Error(
      `Unsupported task priority "${value}". Use critical, urgent, high, medium, low, or none.`
    );
  }
  return mapped;
}

function descriptionHtml(markdown) {
  const escaped = markdown
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br />")}</p>`)
    .join("");
}

/** Content fields only. State is applied by the caller on create, never on update. */
export function workItemContent(task) {
  const name = `${task.id} — ${task.title || task.id}`.slice(0, 255);
  return {
    name,
    description_html: descriptionHtml(task.body),
    priority: planePriority(task.priority),
    external_id: task.id,
    external_source: EXTERNAL_SOURCE,
  };
}

function setNestedField(block, key, value) {
  const rendered = value == null || value === "" ? "null" : String(value);
  const line = new RegExp(`^([ \\t]+${key}:[ \\t]*).*$`, "m");
  if (line.test(block)) return block.replace(line, `$1${rendered}`);

  const nl = block.includes("\r\n") ? "\r\n" : "\n";
  return `${block.replace(/\s*$/, "")}${nl}  ${key}: ${rendered}${nl}`;
}

export function writePlaneMapping(source, workItemId, identifier) {
  if (!source.startsWith("---")) throw new Error("Task file is missing front matter");
  const end = source.indexOf("\n---", 3);
  if (end === -1) throw new Error("Invalid front matter");

  const front = source.slice(0, end);
  const rest = source.slice(end);
  const match = front.match(/^plane:[ \t]*\r?\n(?:[ \t]+[^\n]*\r?\n?)*/m);
  if (!match) throw new Error("Task file is missing a plane: block");

  let block = setNestedField(match[0], "work_item_id", workItemId);
  block = setNestedField(block, "identifier", identifier);
  return front.slice(0, match.index) + block + front.slice(match.index + match[0].length) + rest;
}

export function displayIdentifier(projectKey, sequenceId) {
  if (sequenceId == null || sequenceId === "") return null;
  return projectKey ? `${projectKey}-${sequenceId}` : String(sequenceId);
}
