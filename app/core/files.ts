import type { Json } from "~/core/json";

export const FILE_NODE = "file";

/**
 * Formats a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let unit = "B";
  for (const next of units) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  const rounded = value >= 10 ? Math.round(value).toString() : value.toFixed(1);
  return `${rounded} ${unit}`;
}

export interface FileAttrs {
  id: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Collects all file nodes from a tiptap/prosemirror document, deduped by
 * id — copy-pasted file nodes share an id and reference the same stored file.
 */
export function getFileNodes(doc: Json): FileAttrs[] {
  const nodes = new Map<string, FileAttrs>();
  walk(doc, nodes);
  return [...nodes.values()];
}

function walk(node: Json, nodes: Map<string, FileAttrs>): void {
  if (Array.isArray(node)) {
    for (const child of node) {
      walk(child, nodes);
    }
    return;
  }
  if (node === null || typeof node !== "object") {
    return;
  }
  if (node.type === FILE_NODE) {
    const attrs = node.attrs;
    if (
      attrs !== null &&
      typeof attrs === "object" &&
      !Array.isArray(attrs) &&
      typeof attrs.id === "string" &&
      !nodes.has(attrs.id)
    ) {
      nodes.set(attrs.id, {
        id: attrs.id,
        name: typeof attrs.name === "string" ? attrs.name : "",
        size: typeof attrs.size === "number" ? attrs.size : 0,
        type: typeof attrs.type === "string" ? attrs.type : "",
      });
    }
    return;
  }
  if (Array.isArray(node.content)) {
    walk(node.content, nodes);
  }
}
