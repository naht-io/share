import { cx } from "class-variance-authority";
import { FormInputIcon, MoveUpRightIcon, PaperclipIcon, PlusIcon } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useNavigation, useSubmit } from "react-router";

import paperBoat from "~/assets/paper-boat.png";
import { Button } from "~/components/Button";
import { Dropdown } from "~/components/Dropdown";
import { Editor, type EditorHandle } from "~/components/editor/Editor";
import { Form } from "~/components/Form";
import { Select } from "~/components/Select";
import { MAX_FILE_SIZE, MAX_UPLOAD_SIZE } from "~/core/.server/files";
import { ShareExpiry } from "~/core/expiry";
import { getFileNodes, formatFileSize } from "~/core/files";
import { getFormNodes } from "~/core/forms";
import { generateId } from "~/core/id";
import type { Json } from "~/core/json";
import { CustomNode } from "~/core/nodes";

import type { Route } from "./+types/page";

export function meta() {
  return [{ title: "./share" }];
}

export function loader() {
  return { maxFileSize: MAX_FILE_SIZE, maxUploadSize: MAX_UPLOAD_SIZE };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { maxFileSize, maxUploadSize } = loaderData;
  const submit = useSubmit();
  const navigation = useNavigation();
  const editorRef = useRef<EditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Files attached while editing, keyed by chip id. Entries are never removed
  // so undoing a chip deletion keeps working; at submit time only files whose
  // chip is still in the document are sent.
  const filesRef = useRef(new Map<string, File>());
  const [isEmpty, setIsEmpty] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSubmitting = navigation.state !== "idle";

  function attachedSize(content: Json): number {
    return getFileNodes(content).reduce(
      (sum, node) => sum + (filesRef.current.get(node.id)?.size ?? 0),
      0,
    );
  }

  function addFormNode(type: string) {
    const editor = editorRef.current?.editor;
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContentAt(editor.state.selection.to, {
        type,
        attrs: { id: generateId(), name: "", placeholder: "", required: false },
      })
      .run();
  }

  function attachFiles(files: File[], pos?: number) {
    const editor = editorRef.current?.editor;
    if (!editor || files.length === 0) return;
    setError(null);

    let total = attachedSize(editor.getJSON());
    const nodes = [];
    for (const file of files) {
      if (file.size > maxFileSize) {
        setError(`"${file.name}" is larger than ${formatFileSize(maxFileSize)}`);
        continue;
      }
      if (total + file.size > maxUploadSize) {
        setError(`Attachments are limited to ${formatFileSize(maxUploadSize)} in total`);
        break;
      }
      total += file.size;
      const id = generateId();
      filesRef.current.set(id, file);
      nodes.push({
        type: CustomNode.FILE,
        attrs: { id, name: file.name, size: file.size, type: file.type },
      });
    }
    if (nodes.length > 0) {
      editor
        .chain()
        .focus()
        .insertContentAt(pos ?? editor.state.selection.to, nodes)
        .run();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const editor = editorRef.current?.editor;
    if (!editor) return;

    const content = editor.getJSON();
    const fileNodes = getFileNodes(content as Json);

    const missing = fileNodes.find((node) => !filesRef.current.has(node.id));
    if (missing) {
      setError(`Missing file data for "${missing.name}" — remove the chip and re-attach it`);
      return;
    }
    if (attachedSize(content as Json) > maxUploadSize) {
      setError(`Attachments are limited to ${formatFileSize(maxUploadSize)} in total`);
      return;
    }
    if (getFormNodes(content as Json).some((node) => node.name.trim() === "")) {
      setError("Every input field needs a name — set one via its edit button");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const body = new FormData();
    body.set("content", JSON.stringify(content));
    body.set("expiry", String(formData.get("expiry")));
    for (const node of fileNodes) {
      const file = filesRef.current.get(node.id)!;
      body.append(`file:${node.id}`, file, file.name);
    }
    submit(body, { method: "POST", action: "/s", encType: "multipart/form-data" });
  }

  return (
    <div className="grid w-full max-w-[calc(65ch+0.25rem*20)] grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
      <img
        src={paperBoat}
        alt=""
        className="w-16 md:w-32 justify-self-start md:sticky md:top-4 rounded-xs md:col-start-1 md:row-start-2"
      />
      <aside className="flex justify-end md:col-start-2 md:row-start-1">
        <Dropdown>
          <Dropdown.Trigger size="sm" variant="text">
            <PlusIcon />
            Add field
          </Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu aria-label="Field type" className="*:flex *:items-center *:gap-2">
              <Dropdown.MenuItem onAction={() => addFormNode(CustomNode.INPUT)}>
                <FormInputIcon className="size-4" />
                Input
              </Dropdown.MenuItem>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            attachFiles(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = "";
          }}
        />
        <Button size="sm" variant="text" onPress={() => fileInputRef.current?.click()}>
          <PaperclipIcon />
          Add files
        </Button>
      </aside>
      <Form className="min-w-0 space-y-4 md:col-start-2 md:row-start-2" onSubmit={handleSubmit}>
        <main
          className={cx(
            "border border-zinc-300 dark:border-zinc-700 shadow-sm dark:shadow-black/50",
            "bg-zinc-50 dark:bg-zinc-900",
            "focus-within:ring-4 focus-within:ring-zinc-200  dark:focus-within:ring-zinc-600",
            "transition-shadow",
          )}
        >
          <Editor
            autofocus={true}
            ref={editorRef}
            onCreate={(editor) => setIsEmpty(editor.isEmpty)}
            onUpdate={(editor) => setIsEmpty(editor.isEmpty)}
            onFiles={attachFiles}
          />
        </main>
        {error && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <aside className="flex justify-between gap-2">
          <Select aria-label="Expiry" defaultValue="tomorrow" name="expiry">
            <Select.Trigger></Select.Trigger>
            <Select.Popover>
              <Select.List>
                <Select.Item id={ShareExpiry.TOMORROW}>Expire tomorrow</Select.Item>
                <Select.Item id={ShareExpiry.THREE_DAYS}>Expire in 3 days</Select.Item>
                <Select.Item id={ShareExpiry.ONE_WEEK}>Expire in 1 week</Select.Item>
                <Select.Item id={ShareExpiry.ONE_MONTH}>Expire in 1 month</Select.Item>
                <Select.Item id={ShareExpiry.NEVER} isDisabled={true}>
                  Never expire
                </Select.Item>
              </Select.List>
            </Select.Popover>
          </Select>
          <Button type="submit" isDisabled={isEmpty || isSubmitting}>
            Share
            <MoveUpRightIcon className="size-4" />
          </Button>
        </aside>
      </Form>
    </div>
  );
}
