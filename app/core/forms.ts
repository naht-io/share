import type { Json } from "~/core/json";

import { CustomNode } from "./nodes";

export const maxNameLength = 200;
export const maxPlaceholderLength = 200;
export const maxValueLength = 1024;

/** Submitted values per form node id, non-empty and newest first. */
export type FormResults = Record<string, string[]>;

export interface FormNodeAttrs {
  id: string;
  type: string;
  name: string;
  /** Input-specific; lives on the shared attrs until a second node type forces a split. */
  placeholder: string;
  required: boolean;
}

/**
 * Collects all form nodes from a tiptap/prosemirror document, deduped by
 * id — copy-pasted form nodes share an id and act as a single field.
 */
export function getFormNodes(doc: Json): FormNodeAttrs[] {
  const nodes = new Map<string, FormNodeAttrs>();
  walk(doc, nodes);
  return [...nodes.values()];
}

function walk(node: Json, nodes: Map<string, FormNodeAttrs>): void {
  if (Array.isArray(node)) {
    for (const child of node) {
      walk(child, nodes);
    }
    return;
  }
  if (node === null || typeof node !== "object") {
    return;
  }
  if (node.type === CustomNode.INPUT) {
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
        type: node.type,
        name: typeof attrs.name === "string" ? attrs.name : "",
        placeholder: typeof attrs.placeholder === "string" ? attrs.placeholder : "",
        required: attrs.required === true,
      });
    }
    return;
  }
  if (Array.isArray(node.content)) {
    walk(node.content, nodes);
  }
}
