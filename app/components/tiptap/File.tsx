import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { PaperclipIcon, XIcon } from "lucide-react";

import { FILE_NODE, formatFileSize } from "~/core/files";

import { Button } from "../Button";
import { Chip } from "../Chip";

export interface FileOptions {
  /** Base path for downloads on the read-only page, e.g. `/s/abc/files`. */
  downloadBasePath?: string;
}

export const File = Node.create<FileOptions>({
  name: FILE_NODE,
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
    return [{ tag: "div[data-file]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-file": "" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileView);
  },
});

function FileView({ node, editor, extension, deleteNode }: NodeViewProps) {
  const { id, name, size } = node.attrs;
  const downloadBasePath = (extension.options as FileOptions).downloadBasePath;

  const content = (
    <>
      <PaperclipIcon className="size-4 shrink-0" />
      <span className="flex items-baseline gap-1.5">
        <span className="truncate max-w-64">{name}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatFileSize(size)}</span>
      </span>
      {editor.isEditable && (
        <Button
          size="icon-xs"
          variant="text"
          aria-label={`Remove ${name}`}
          onPress={() => deleteNode()}
        >
          <XIcon />
        </Button>
      )}
    </>
  );

  return (
    <NodeViewWrapper data-file="">
      {!editor.isEditable && downloadBasePath ? (
        <Chip as="a" interactive href={`${downloadBasePath}/${id}`} download={name}>
          {content}
        </Chip>
      ) : (
        <Chip className={editor.isEditable ? "pr-1" : undefined}>{content}</Chip>
      )}
    </NodeViewWrapper>
  );
}
