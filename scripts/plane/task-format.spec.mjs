import assert from "node:assert/strict";
import test from "node:test";
import {
  displayIdentifier,
  markdownToPlaneHtml,
  parseTaskSource,
  workItemContent,
  writePlaneMapping,
} from "./task-format.mjs";

const sample = `---
id: BE-009
type: task
area: backend
status: implemented
priority: critical
plane:
  work_item_id: null
  identifier: null
---

# BE-009 — Identity and access HTTP

## Objective

Keep <tokens> & sessions server-side.
`;

test("parseTaskSource reads nested Plane ids and the heading title", () => {
  const parsed = parseTaskSource(sample);
  assert.equal(parsed.data.id, "BE-009");
  assert.equal(parsed.data.priority, "critical");
  assert.equal(parsed.plane.work_item_id, null);
  assert.equal(parsed.title, "Identity and access HTTP");
  assert.match(parsed.body, /^# BE-009/);
});

test("parseTaskSource skips markdown without a task id", () => {
  assert.equal(parseTaskSource("# Master list\n\nNo front matter.\n"), null);
  assert.equal(parseTaskSource("---\ntype: note\n---\n\n# Note\n"), null);
});

const nestedDesignSample = `---
id: FE-018
type: task
area: frontend
status: pending
priority: high
design:
  required: true
  tool: figma
  file_url: https://www.figma.com/design/example
  frame: Homepage
  status: approved
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: null
  identifier: null
---

# FE-018 — Marketing homepage

## Objective

Ship the approved homepage.

## Dependencies

Figma: https://www.figma.com/design/example
`;

test("parseTaskSource still reads id when nested design blocks are present", () => {
  const parsed = parseTaskSource(nestedDesignSample);
  assert.equal(parsed.data.id, "FE-018");
  assert.equal(parsed.data.priority, "high");
  assert.equal(parsed.data.status, "pending");
  assert.equal(parsed.title, "Marketing homepage");
  assert.equal(parsed.plane.work_item_id, null);
});

test("writePlaneMapping fills plane without dropping nested design blocks", () => {
  const next = writePlaneMapping(
    nestedDesignSample,
    "11111111-1111-1111-1111-111111111111",
    "MEDCONNECT-51"
  );
  assert.match(next, /id: FE-018/);
  assert.match(next, /design:\n  required: true/);
  assert.match(next, /implementation:\n  status: not_started/);
  assert.match(next, /validation:\n  responsive: true/);
  assert.match(next, /work_item_id: 11111111-1111-1111-1111-111111111111/);
  assert.match(next, /identifier: MEDCONNECT-51/);
  const parsed = parseTaskSource(next);
  assert.equal(parsed.data.id, "FE-018");
  assert.equal(parsed.plane.work_item_id, "11111111-1111-1111-1111-111111111111");
  assert.equal(parsed.plane.identifier, "MEDCONNECT-51");
});

test("workItemContent maps critical to urgent and omits state", () => {
  const parsed = parseTaskSource(sample);
  const content = workItemContent({
    id: parsed.data.id,
    title: parsed.title,
    priority: parsed.data.priority,
    body: parsed.body,
  });

  assert.equal(content.name, "BE-009 — Identity and access HTTP");
  assert.equal(content.priority, "urgent");
  assert.equal(content.external_id, "BE-009");
  assert.equal(content.external_source, "medconnect-tasks");
  assert.equal(content.state, undefined);
  assert.match(content.description_html, /<h2>Objective<\/h2>/);
  assert.match(content.description_html, /&lt;tokens&gt;/);
  assert.match(content.description_html, /&amp;/);
  assert.doesNotMatch(content.description_html, /<tokens>/);
  assert.doesNotMatch(content.description_html, /<h1>/);
});

test("markdownToPlaneHtml renders headings, lists, quotes, code, tables, and emphasis", () => {
  const html = markdownToPlaneHtml(`# Skip title

## Scope

A paragraph
with a break.

- bullet
  - nested
1. first
2. second

- [ ] open
- [x] done

> quoted **bold** and \`code\`

\`\`\`
<script>nope()</script>
\`\`\`

| Col | Other |
| --- | --- |
| *a* | b |

---

See [docs](https://example.com/path) and [skip](javascript:alert(1)).
~~old~~ and *em* and a <tag>.
`);

  assert.match(html, /<h2>Scope<\/h2>/);
  assert.doesNotMatch(html, /Skip title/);
  assert.match(html, /<p>A paragraph<br \/>with a break\.<\/p>/);
  assert.match(html, /<ul><li><p>bullet<\/p><ul><li><p>nested<\/p><\/li><\/ul><\/li><\/ul>/);
  assert.match(html, /<ol><li><p>first<\/p><\/li><li><p>second<\/p><\/li><\/ol>/);
  assert.match(html, /data-type="taskList"/);
  assert.match(html, /data-checked="false"/);
  assert.match(html, /data-checked="true"/);
  assert.match(html, /<blockquote><p>quoted <strong>bold<\/strong> and <code>code<\/code><\/p><\/blockquote>/);
  assert.match(html, /<pre><code>&lt;script&gt;nope\(\)&lt;\/script&gt;<\/code><\/pre>/);
  assert.match(html, /<table><thead><tr><th>Col<\/th><th>Other<\/th><\/tr><\/thead><tbody><tr><td><em>a<\/em><\/td><td>b<\/td><\/tr><\/tbody><\/table>/);
  assert.match(html, /<hr>/);
  assert.match(html, /<a href="https:\/\/example.com\/path">docs<\/a>/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /skip/);
  assert.match(html, /<s>old<\/s>/);
  assert.match(html, /<em>em<\/em>/);
  assert.match(html, /&lt;tag&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test("markdownToPlaneHtml drops non-http link schemes and does not emit img", () => {
  const html = markdownToPlaneHtml(`![logo](https://example.com/x.png)\n\n[ok](https://ok.example)\n[mail](mailto:demo@example.com)\n[bad](data:text/html,hi)\n`);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, />logo</);
  assert.match(html, /<a href="https:\/\/ok.example\/">ok<\/a>/);
  assert.match(html, /<a href="mailto:demo@example.com">mail<\/a>/);
  assert.doesNotMatch(html, /data:/);
});

test("writePlaneMapping fills the plane block without rewriting other fields", () => {
  const next = writePlaneMapping(sample, "11111111-1111-1111-1111-111111111111", "MED-9");
  assert.match(next, /id: BE-009/);
  assert.match(next, /priority: critical/);
  assert.match(next, /work_item_id: 11111111-1111-1111-1111-111111111111/);
  assert.match(next, /identifier: MED-9/);
  assert.match(next, /Keep <tokens> & sessions server-side\./);

  const again = writePlaneMapping(next, "22222222-2222-2222-2222-222222222222", "MED-10");
  assert.match(again, /work_item_id: 22222222-2222-2222-2222-222222222222/);
  assert.match(again, /identifier: MED-10/);
  assert.equal(again.match(/work_item_id:/g).length, 1);
});

test("writePlaneMapping inserts a plane block when the file has none", () => {
  const source = `---
id: FE-014
type: task
priority: high
---

# FE-014 — Telehealth UI

## Objective

Connect the lobby.
`;
  const next = writePlaneMapping(source, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "MEDCONNECT-46");
  assert.match(
    next,
    /priority: high\nplane:\n  work_item_id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\n  identifier: MEDCONNECT-46\n---/
  );
  assert.match(next, /Connect the lobby\./);
  const parsed = parseTaskSource(next);
  assert.equal(parsed.plane.work_item_id, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  assert.equal(parsed.plane.identifier, "MEDCONNECT-46");

  const again = writePlaneMapping(next, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "MEDCONNECT-47");
  assert.equal(again.match(/^plane:/gm).length, 1);
  assert.equal(again.match(/work_item_id:/g).length, 1);
});

test("writePlaneMapping inserts a CRLF plane block", () => {
  const source = "---\r\nid: FE-014\r\npriority: high\r\n---\r\n\r\n# FE-014 — Title\r\n";
  const next = writePlaneMapping(source, "id-1", "MED-1");
  assert.match(next, /priority: high\r\nplane:\r\n  work_item_id: id-1\r\n  identifier: MED-1\r\n---/);
});

test("displayIdentifier uses the project key and sequence", () => {
  assert.equal(displayIdentifier("MED", 12), "MED-12");
  assert.equal(displayIdentifier(null, 12), "12");
  assert.equal(displayIdentifier("MED", null), null);
});
