import type { FormResults } from "~/core/forms";

/**
 * A share mode describes how a shared document is being presented, which in
 * turn drives how form nodes render:
 *
 * - `edit` — the author is composing the document and can configure form nodes.
 * - `form` — a visitor sees the document as a fillable form to submit.
 * - `results` — the submitted values are displayed per form node.
 */
export type ShareMode = EditMode | FormMode | ResultsMode;

export type EditMode = { mode: "edit" };
export type FormMode = { mode: "form" };
export type ResultsMode = { mode: "results"; results: FormResults };
