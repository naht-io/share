import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { PaperclipIcon, XIcon } from "lucide-react";

import { Button } from "~/components/Button";
import { Chip } from "~/components/Chip";
import { formatFileSize } from "~/core/files";
import { CustomNode } from "~/core/nodes";

import { useShareMode } from "../share-mode.context";

export interface FileOptions {
  /**
   * The base path for downloads
   *
   * @example "/s/abc/files"
   */
  basePath?: string;
}

export const File = Node.create<FileOptions>({
  name: CustomNode.FILE,
  atom: true,
  group: "block",

  addOptions() {
    return { basePath: undefined };
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

function FileView({ node, extension, deleteNode }: NodeViewProps) {
  const { id, name, size } = node.attrs;
  const basePath = (extension.options as FileOptions).basePath;
  const shareMode = useShareMode();

  return (
    <NodeViewWrapper data-file="">
      {shareMode.mode !== "edit" && basePath ? (
        <ShowFileView name={name} size={size} href={`${basePath}/${id}`} />
      ) : (
        <EditFileView name={name} size={size} onRemove={deleteNode} />
      )}
    </NodeViewWrapper>
  );
}

function EditFileView({
  name,
  size,
  onRemove,
}: {
  name: string;
  size: number;

  onRemove: () => void;
}) {
  return (
    <Chip>
      <PaperclipIcon className="size-4 shrink-0" />
      <span className="flex items-baseline gap-1.5">
        <span className="truncate max-w-48 sm:max-w-64">{name}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatFileSize(size)}</span>
      </span>
      <Button size="icon-xs" variant="text" aria-label={`Remove ${name}`} onPress={onRemove}>
        <XIcon />
      </Button>
    </Chip>
  );
}

function ShowFileView({ name, size, href }: { name: string; size: number; href: string }) {
  return (
    <Chip as="a" interactive href={href} download={name}>
      <PaperclipIcon className="size-4 shrink-0" />
      <span className="flex items-baseline gap-1.5">
        <span className="truncate max-w-48 sm:max-w-64">{name}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatFileSize(size)}</span>
      </span>
    </Chip>
  );
}
