import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { cx } from "class-variance-authority";
import { PaperclipIcon, XIcon } from "lucide-react";

import { FILE_CHIP_NODE, formatFileSize } from "~/core/files";

import { Button } from "./Button";

export interface FileChipOptions {
  /** Base path for downloads on the read-only page, e.g. `/s/abc/files`. */
  downloadBasePath?: string;
}

export const FileChip = Node.create<FileChipOptions>({
  name: FILE_CHIP_NODE,
  atom: true,
  group: "block",
  draggable: true,

  addOptions() {
    return { downloadBasePath: undefined };
  },

  addAttributes() {
    return {
      id: { default: null },
      name: { default: "" },
      size: { default: 0 },
      type: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-file-chip]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-file-chip": "" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileChipView);
  },
});

function FileChipView({ node, editor, extension, deleteNode }: NodeViewProps) {
  const { id, name, size } = node.attrs;
  const downloadBasePath = (extension.options as FileChipOptions)
    .downloadBasePath;

  const className = cx(
    "inline-flex items-center gap-1.5 select-none",
    "rounded-xs",
    "bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-sm",
  );
  const chip = (
    <>
      <PaperclipIcon className="size-3.5 shrink-0" />
      <span className="truncate max-w-64">{name}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {formatFileSize(size)}
      </span>
      {editor.isEditable && (
        <Button
          size="icon-xs"
          variant="text"
          aria-label={`Remove ${name}`}
          onPress={() => deleteNode()}
        >
          <XIcon className="size-3.5" />
        </Button>
      )}
    </>
  );

  return (
    <NodeViewWrapper data-file-chip="" className="my-1">
      {!editor.isEditable && downloadBasePath ? (
        <a
          href={`${downloadBasePath}/${id}`}
          download={name}
          className={cx(
            className,
            "text-inherit no-underline",
            "hover:bg-zinc-900/10 dark:hover:bg-zinc-300/10 transition-colors duration-100",
          )}
        >
          {chip}
        </a>
      ) : (
        <span className={className}>{chip}</span>
      )}
    </NodeViewWrapper>
  );
}
