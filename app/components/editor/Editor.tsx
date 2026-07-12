import { FileHandler } from "@tiptap/extension-file-handler";
import { Placeholder } from "@tiptap/extensions";
import { useEditor, EditorContent, type Editor as TiptapEditor, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import "./Editor.css";
import { useImperativeHandle, useMemo, type Ref } from "react";

import type { ShareMode } from "~/core/share";

import { BubbleMenu } from "./BubbleMenu";
import { File as FileNode } from "./nodes/File";
import { FormInput } from "./nodes/FormInput";
import { ShareModeContext } from "./share-mode.context";

export interface EditorProps {
  autofocus?: boolean;
  content?: Content;
  /**
   * How form nodes render; defaults to edit mode (the create page). The
   * document is only editable in edit mode.
   */
  mode?: ShareMode;
  onCreate?: (editor: TiptapEditor) => void;
  onUpdate?: (isEmpty: TiptapEditor) => void;
  /** Called with files dropped or pasted into the editor. `pos` is the drop position. */
  onFiles?: (files: File[], pos?: number) => void;
  /** Base path file nodes link to on the read-only page, e.g. `/s/abc/files`. */
  basePath?: string;
  ref?: Ref<EditorHandle>;
}

export interface EditorHandle {
  editor: TiptapEditor | null;
}

export function Editor(props: EditorProps) {
  const editable = (props.mode?.mode ?? "edit") === "edit";

  const editor = useEditor({
    autofocus: props.autofocus,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "p-4 md:p-8",
      },
    },
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Share something with the world...",
      }),
      FileNode.configure({
        basePath: props.basePath,
      }),
      FormInput,
      FileHandler.configure({
        onDrop: (_editor, files, pos) => {
          props.onFiles?.(files, pos);
        },
        onPaste: (_editor, files, htmlContent) => {
          // When the clipboard also carries HTML (e.g. copied rich text), let
          // the other extensions insert that instead of duplicating the files.
          if (htmlContent) return;
          props.onFiles?.(files);
        },
      }),
    ],
    content: props.content,
    editable,
    onCreate: ({ editor }) => props.onCreate?.(editor),
    onUpdate: ({ editor }) => props.onUpdate?.(editor),
  });

  useImperativeHandle(props.ref, () => ({ editor }), [editor]);

  // Stable context value so form node views don't re-render on every editor
  // state change while the form prop itself is unchanged.
  const formContext = useMemo(() => props.mode ?? { mode: "edit" as const }, [props.mode]);

  if (!editor) {
    return (
      <div className="p-4 md:p-8">
        {editable ? (
          <span className="text-zinc-500 dark:text-zinc-400">
            Share something with the world...
          </span>
        ) : (
          <div className="space-y-3 animate-pulse">
            <div className="rounded-full w-full h-4 bg-zinc-200 dark:bg-zinc-700"></div>
            <div className="rounded-full w-full h-4 bg-zinc-200 dark:bg-zinc-700"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ShareModeContext value={formContext}>
      <EditorContent editor={editor} />
      <BubbleMenu editor={editor} />
    </ShareModeContext>
  );
}
