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

const PLACEHOLDER = "\u0000";

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

function escapeText(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttr(value) {
  return escapeText(value).replaceAll('"', "&quot;");
}

function safeHref(raw) {
  const trimmed = raw.trim().replace(/^<|>$/g, "");
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:" && parsed.protocol !== "mailto:") {
    return null;
  }
  return parsed.href;
}

function inlineHtml(text) {
  const slots = [];
  const stash = (html) => {
    const token = `${PLACEHOLDER}${slots.length}${PLACEHOLDER}`;
    slots.push(html);
    return token;
  };

  let source = text.replace(/`([^`]+)`/g, (_, code) => stash(`<code>${escapeText(code)}</code>`));

  source = source.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt) => escapeText(alt));

  source = source.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const href = safeHref(url);
    if (!href) return label;
    return stash(`<a href="${escapeAttr(href)}">${inlineHtml(label)}</a>`);
  });

  source = escapeText(source);
  source = source.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  source = source.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  source = source.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  source = source.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  source = source.replace(/(?<!\w)_([^_]+)_(?!\w)/g, "<em>$1</em>");

  return source.replace(new RegExp(`${PLACEHOLDER}(\\d+)${PLACEHOLDER}`, "g"), (_, index) => slots[Number(index)]);
}

function isBlank(line) {
  return /^\s*$/.test(line);
}

function headingMatch(line) {
  return line.match(/^(#{1,6})\s+(.+?)\s*$/);
}

function isHr(line) {
  return /^(?:\s*)(-{3,}|\*{3,}|_{3,})(?:\s*)$/.test(line);
}

function isFence(line) {
  return /^```/.test(line);
}

function isTableRow(line) {
  return /^\s*\|.+\|\s*$/.test(line);
}

function isQuote(line) {
  return /^\s{0,3}>/.test(line);
}

function listItemMatch(line) {
  const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(?:\[([ xX])\]\s+)?(.*)$/);
  if (!match) return null;
  const indent = match[1].replaceAll("\t", "  ").length;
  return {
    level: indent >= 2 ? 1 : 0,
    ordered: /^\d+\.$/.test(match[2]),
    task: match[3] !== undefined,
    checked: match[3] === "x" || match[3] === "X",
    text: match[4],
  };
}

function splitCells(row) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isDividerRow(row) {
  return splitCells(row).every((cell) => /^:?-{3,}:?$/.test(cell));
}

function renderListItems(items, ordered, task) {
  const open = task
    ? '<ul data-type="taskList">'
    : ordered
      ? "<ol>"
      : "<ul>";
  const close = task || !ordered ? "</ul>" : "</ol>";
  const parts = [open];

  for (const item of items) {
    const inner = `<p>${inlineHtml(item.text)}</p>`;
    let body = inner;
    if (item.children?.length) {
      body += renderListItems(item.children, item.childOrdered, item.childTask);
    }
    if (task) {
      parts.push(
        `<li data-type="taskItem" data-checked="${item.checked ? "true" : "false"}"><label><input type="checkbox"${item.checked ? " checked" : ""} disabled><span></span></label><div>${body}</div></li>`
      );
    } else {
      parts.push(`<li>${body}</li>`);
    }
  }

  parts.push(close);
  return parts.join("");
}

function consumeList(lines, start) {
  const roots = [];
  let ordered;
  let task;
  let i = start;

  while (i < lines.length) {
    const item = listItemMatch(lines[i]);
    if (!item) break;
    if (ordered === undefined) {
      ordered = item.ordered;
      task = item.task;
    }
    if (item.level === 0 && (item.ordered !== ordered || item.task !== task)) break;

    if (item.level === 0) {
      roots.push({ ...item, children: [] });
    } else if (roots.length === 0) {
      roots.push({ ...item, level: 0, children: [] });
    } else {
      const parent = roots[roots.length - 1];
      if (parent.children.length === 0) {
        parent.childOrdered = item.ordered;
        parent.childTask = item.task;
      }
      if (item.ordered !== parent.childOrdered || item.task !== parent.childTask) break;
      parent.children.push(item);
    }
    i += 1;
  }

  return { html: renderListItems(roots, ordered, task), next: i };
}

function consumeQuote(lines, start) {
  const collected = [];
  let i = start;
  while (i < lines.length && isQuote(lines[i])) {
    collected.push(lines[i].replace(/^\s{0,3}>\s?/, ""));
    i += 1;
  }
  const inner = collected.join("\n").trim();
  const paragraphs = inner
    ? inner
        .split(/\n{2,}/)
        .map((block) => `<p>${inlineHtml(block).replaceAll("\n", "<br />")}</p>`)
        .join("")
    : "<p></p>";
  return { html: `<blockquote>${paragraphs}</blockquote>`, next: i };
}

function consumeFence(lines, start) {
  let i = start + 1;
  const body = [];
  while (i < lines.length && !isFence(lines[i])) {
    body.push(lines[i]);
    i += 1;
  }
  if (i < lines.length) i += 1;
  return { html: `<pre><code>${escapeText(body.join("\n"))}</code></pre>`, next: i };
}

function consumeTable(lines, start) {
  const rows = [];
  let i = start;
  while (i < lines.length && isTableRow(lines[i])) {
    rows.push(lines[i]);
    i += 1;
  }
  if (rows.length === 0) return null;

  let head = splitCells(rows[0]);
  let bodyRows = rows.slice(1);
  if (bodyRows[0] && isDividerRow(bodyRows[0])) bodyRows = bodyRows.slice(1);

  const thead = `<thead><tr>${head.map((cell) => `<th>${inlineHtml(cell)}</th>`).join("")}</tr></thead>`;
  const tbody = bodyRows.length
    ? `<tbody>${bodyRows
        .map((row) => `<tr>${splitCells(row).map((cell) => `<td>${inlineHtml(cell)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`
    : "";
  return { html: `<table>${thead}${tbody}</table>`, next: i };
}

function consumeParagraph(lines, start) {
  const collected = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (
      isBlank(line) ||
      headingMatch(line) ||
      isHr(line) ||
      isFence(line) ||
      isQuote(line) ||
      listItemMatch(line) ||
      isTableRow(line)
    ) {
      break;
    }
    collected.push(line);
    i += 1;
  }
  const html = `<p>${inlineHtml(collected.join("\n")).replaceAll("\n", "<br />")}</p>`;
  return { html, next: i };
}

export function markdownToPlaneHtml(markdown) {
  const lines = String(markdown ?? "")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .split("\n");

  let index = 0;
  while (index < lines.length && isBlank(lines[index])) index += 1;
  if (index < lines.length && /^#\s+/.test(lines[index]) && !/^##/.test(lines[index])) {
    index += 1;
    while (index < lines.length && isBlank(lines[index])) index += 1;
  }

  const blocks = [];
  while (index < lines.length) {
    if (isBlank(lines[index])) {
      index += 1;
      continue;
    }

    const heading = headingMatch(lines[index]);
    if (heading) {
      const level = heading[1].length;
      blocks.push(`<h${level}>${inlineHtml(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (isHr(lines[index])) {
      blocks.push("<hr>");
      index += 1;
      continue;
    }

    if (isFence(lines[index])) {
      const fence = consumeFence(lines, index);
      blocks.push(fence.html);
      index = fence.next;
      continue;
    }

    if (isQuote(lines[index])) {
      const quote = consumeQuote(lines, index);
      blocks.push(quote.html);
      index = quote.next;
      continue;
    }

    if (listItemMatch(lines[index])) {
      const list = consumeList(lines, index);
      blocks.push(list.html);
      index = list.next;
      continue;
    }

    if (isTableRow(lines[index])) {
      const table = consumeTable(lines, index);
      blocks.push(table.html);
      index = table.next;
      continue;
    }

    const paragraph = consumeParagraph(lines, index);
    blocks.push(paragraph.html);
    index = paragraph.next;
  }

  return blocks.join("") || "<p></p>";
}

/** Content fields only. State is applied by the caller on create, never on update. */
export function workItemContent(task) {
  const name = `${task.id} — ${task.title || task.id}`.slice(0, 255);
  return {
    name,
    description_html: markdownToPlaneHtml(task.body),
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
