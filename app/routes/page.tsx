import { cx } from "class-variance-authority";
import { MoveUpRightIcon, PaperclipIcon } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useNavigation, useSubmit } from "react-router";

import paperBoat from "~/assets/paper-boat.png";
import { Button } from "~/components/Button";
import { Editor, type EditorHandle } from "~/components/Editor";
import { Form } from "~/components/Form";
import { Select } from "~/components/Select";
import { ShareExpiry } from "~/core/expiry";
import { FILE_NODE, getFileNodes, formatFileSize } from "~/core/files";
import { generateId } from "~/core/ids";
import type { Json } from "~/core/json";

import type { Route } from "./+types/page";
import { MAX_FILE_SIZE, MAX_UPLOAD_SIZE } from "~/core/.server/files";

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
  const [fileError, setFileError] = useState<string | null>(null);
  const isSubmitting = navigation.state !== "idle";

  function attachedSize(content: Json): number {
    return getFileNodes(content).reduce(
      (sum, node) => sum + (filesRef.current.get(node.id)?.size ?? 0),
      0,
    );
  }

  function attachFiles(files: File[], pos?: number) {
    const editor = editorRef.current?.editor;
    if (!editor || files.length === 0) return;
    setFileError(null);

    let total = attachedSize(editor.getJSON());
    const nodes = [];
    for (const file of files) {
      if (file.size > maxFileSize) {
        setFileError(`"${file.name}" is larger than ${formatFileSize(maxFileSize)}`);
        continue;
      }
      if (total + file.size > maxUploadSize) {
        setFileError(`Attachments are limited to ${formatFileSize(maxUploadSize)} in total`);
        break;
      }
      total += file.size;
      const id = generateId();
      filesRef.current.set(id, file);
      nodes.push({
        type: FILE_NODE,
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
      setFileError(`Missing file data for "${missing.name}" — remove the chip and re-attach it`);
      return;
    }
    if (attachedSize(content as Json) > maxUploadSize) {
      setFileError(`Attachments are limited to ${formatFileSize(maxUploadSize)} in total`);
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
        <Button
          size="sm"
          variant="text"
          className="inline-flex gap-1"
          onPress={() => fileInputRef.current?.click()}
        >
          <PaperclipIcon className="size-4" />
          Add files
        </Button>
      </aside>
      <Form className="min-w-0 space-y-4 md:col-start-2 md:row-start-2" onSubmit={handleSubmit}>
        <main
          className={cx(
            "border border-zinc-300 dark:border-zinc-700 shadow-sm",
            "focus-within:ring-4 focus-within:ring-zinc-200  dark:focus-within:ring-zinc-600",
            "transition-shadow",
          )}
        >
          <Editor
            ref={editorRef}
            onCreate={(editor) => setIsEmpty(editor.isEmpty)}
            onUpdate={(editor) => setIsEmpty(editor.isEmpty)}
            onFiles={attachFiles}
          />
        </main>
        {fileError && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {fileError}
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
          <Button className="inline-flex gap-1" type="submit" isDisabled={isEmpty || isSubmitting}>
            Share
            <MoveUpRightIcon className="size-4" />
          </Button>
        </aside>
      </Form>
    </div>
  );
}
