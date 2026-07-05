import { FileHandler } from "@tiptap/extension-file-handler";
import { Placeholder } from "@tiptap/extensions";
import {
  useEditor,
  useEditorState,
  EditorContent,
  type Editor as TiptapEditor,
  type Content,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { cx } from "class-variance-authority";
import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  TextAlignStartIcon,
  TextQuoteIcon,
  UnderlineIcon,
} from "lucide-react";

import "./Editor.css";
import { AnimatePresence, motion } from "motion/react";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { ToggleButtonGroup, Toolbar } from "react-aria-components";

import { Dropdown } from "./Dropdown";
import { File as FileNode } from "./tiptap/File";
import { ToggleButton } from "./ToggleButton";

export interface EditorProps {
  autofocus?: boolean;
  editable?: boolean;
  content?: Content;
  onCreate?: (editor: TiptapEditor) => void;
  onUpdate?: (isEmpty: TiptapEditor) => void;
  /** Called with files dropped or pasted into the editor. `pos` is the drop position. */
  onFiles?: (files: File[], pos?: number) => void;
  /** Base path file nodes link to on the read-only page, e.g. `/s/abc/files`. */
  fileDownloadBasePath?: string;
  ref?: Ref<EditorHandle>;
}

export interface EditorHandle {
  editor: TiptapEditor | null;
}

export function Editor(props: EditorProps) {
  // The extensions array is only evaluated once by useEditor, so the file
  // callbacks read the latest onFiles through a ref to avoid stale closures.
  const onFilesRef = useRef(props.onFiles);
  onFilesRef.current = props.onFiles;

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
        downloadBasePath: props.fileDownloadBasePath,
      }),
      FileHandler.configure({
        onDrop: (_editor, files, pos) => {
          onFilesRef.current?.(files, pos);
        },
        onPaste: (_editor, files, htmlContent) => {
          // When the clipboard also carries HTML (e.g. copied rich text), let
          // the other extensions insert that instead of duplicating the files.
          if (htmlContent) return;
          onFilesRef.current?.(files);
        },
      }),
    ],
    content: props.content,
    editable: props.editable ?? true,
    onCreate: ({ editor }) => props.onCreate?.(editor),
    onUpdate: ({ editor }) => props.onUpdate?.(editor),
  });

  useImperativeHandle(props.ref, () => ({ editor }), [editor]);

  const marks = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor?.isActive("bold") ?? false,
      isItalic: editor?.isActive("italic") ?? false,
      isUnderline: editor?.isActive("underline") ?? false,
    }),
  });

  const [isOpen, setIsOpen] = useState(false);
  const [animatePosition, setAnimatePosition] = useState(false);
  // Bumped each time the menu appears, used as a key to remount the Toolbar so
  // its roving focus resets to the first control instead of restoring the last
  // focused one (React Aria's standard toolbar behavior).
  const [showCount, setShowCount] = useState(0);

  // Tracks whether the Style dropdown is open. Its popover is portaled to
  // <body>, so opening it blurs the editor. Read by the bubble menu's
  // shouldShow to keep the menu mounted while the dropdown is open (see below).
  const isStyleOpenRef = useRef(false);

  const bubbleMenuRef = useRef<HTMLDivElement>(null);

  if (!editor) {
    return (
      <div className="p-4 md:p-8">
        {(props.editable ?? true) ? (
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
    <>
      <EditorContent editor={editor} />
      <AnimatePresence>
        <BubbleMenu
          ref={bubbleMenuRef}
          editor={editor}
          shouldShow={({ editor, element, view, state, from, to }) => {
            // While the Style dropdown is open, keep the menu shown. Opening the
            // dropdown blurs the editor (its popover lives in a portal outside
            // the menu), which would otherwise hide the menu on the next editor
            // update and detach the dropdown's trigger — flinging the open
            // popover to the top-left corner.
            if (isStyleOpenRef.current) {
              return true;
            }

            // Otherwise mirror tiptap's default shouldShow behavior.
            const { doc, selection } = state;
            const isEmptyTextBlock =
              !doc.textBetween(from, to).length && selection instanceof TextSelection;
            const isChildOfMenu = element.contains(document.activeElement);
            const hasEditorFocus = view.hasFocus() || isChildOfMenu;

            return hasEditorFocus && !selection.empty && !isEmptyTextBlock && editor.isEditable;
          }}
          style={
            animatePosition ? { transition: "top 0.15s ease-out, left 0.15s ease-out" } : undefined
          }
          options={{
            onShow: () => {
              // The bubble menu plugin sets tabIndex=0 on its wrapper whenever
              // its view is constructed (including StrictMode's remount cycle),
              // so pressing Tab from the editor would focus the whole popover
              // instead of the first toolbar item. The wrapper is only tabbable
              // while visible, so removing it from the tab order on every show
              // is guaranteed to run after the plugin. Focus then lands on the
              // toolbar's first control (the Toolbar manages roving tabindex
              // among its children).
              bubbleMenuRef.current?.setAttribute("tabindex", "-1");
              setIsOpen(true);
              setShowCount((count) => count + 1);
              // Enable position transitions only after floating-ui has placed
              // the menu once, so it doesn't slide in from its previous spot.
              requestAnimationFrame(() => requestAnimationFrame(() => setAnimatePosition(true)));
            },
            onHide: () => {
              setIsOpen(false);
              setAnimatePosition(false);
            },
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className={cx(
              "rounded-xs shadow-lg",
              "border border-zinc-300 dark:border-zinc-700",
              "bg-zinc-50 dark:bg-zinc-950",
            )}
          >
            <Toolbar
              key={showCount}
              className="flex *:rounded-none *:focus-visible:outline-offset-0"
            >
              <ToggleButtonGroup
                selectionMode="multiple"
                className="*:rounded-none *:focus-visible:outline-offset-0"
              >
                <ToggleButton
                  variant="text"
                  size="icon-sm"
                  aria-label="Bold"
                  isSelected={marks?.isBold ?? false}
                  onChange={() => editor.chain().focus().toggleBold().run()}
                >
                  <BoldIcon />
                </ToggleButton>
                <ToggleButton
                  variant="text"
                  size="icon-sm"
                  aria-label="Italic"
                  isSelected={marks?.isItalic ?? false}
                  onChange={() => editor.chain().focus().toggleItalic().run()}
                >
                  <ItalicIcon />
                </ToggleButton>
                <ToggleButton
                  variant="text"
                  size="icon-sm"
                  aria-label="Underline"
                  isSelected={marks?.isUnderline ?? false}
                  onChange={() => editor.chain().focus().toggleUnderline().run()}
                >
                  <UnderlineIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <Dropdown onOpenChange={(isOpen) => (isStyleOpenRef.current = isOpen)}>
                <Dropdown.Trigger size="sm" variant="text">
                  Style
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <Dropdown.Menu aria-label="Text style" className="*:flex *:items-center *:gap-2">
                    <Dropdown.MenuItem onAction={() => editor.chain().focus().setParagraph().run()}>
                      <TextAlignStartIcon className="size-4" />
                      Paragraph
                    </Dropdown.MenuItem>
                    <Dropdown.MenuItem
                      onAction={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    >
                      <Heading1Icon className="size-4" />
                      Heading 1
                    </Dropdown.MenuItem>
                    <Dropdown.MenuItem
                      onAction={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                      <Heading2Icon className="size-4" />
                      Heading 2
                    </Dropdown.MenuItem>
                    <Dropdown.MenuItem
                      onAction={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    >
                      <Heading3Icon className="size-4" />
                      Heading 3
                    </Dropdown.MenuItem>
                    <Dropdown.MenuItem
                      onAction={() => editor.chain().focus().toggleBlockquote().run()}
                    >
                      <TextQuoteIcon className="size-4" />
                      Blockquote
                    </Dropdown.MenuItem>
                    <Dropdown.MenuItem
                      onAction={() => editor.chain().focus().toggleBulletList().run()}
                    >
                      <ListIcon className="size-4" />
                      Bullet List
                    </Dropdown.MenuItem>
                    <Dropdown.MenuItem
                      onAction={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                      <ListOrderedIcon className="size-4" />
                      Ordered List
                    </Dropdown.MenuItem>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </Toolbar>
          </motion.div>
        </BubbleMenu>
      </AnimatePresence>
    </>
  );
}
