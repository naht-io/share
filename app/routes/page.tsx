import { cx } from "class-variance-authority";
import { MoveUpRightIcon } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useNavigation, useSubmit, type SubmitTarget } from "react-router";

import paperBoat from "~/assets/paper-boat.png";
import { Button } from "~/components/Button";
import { Editor, type EditorHandle } from "~/components/Editor";
import { Form } from "~/components/Form";
import { Select } from "~/components/Select";
import { ShareExpiry } from "~/core/expiry";

export function meta() {
  return [{ title: "./share" }];
}

export default function Index() {
  const submit = useSubmit();
  const navigation = useNavigation();
  const editorRef = useRef<EditorHandle>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const isSubmitting = navigation.state !== "idle";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const editor = editorRef.current?.editor;
    if (!editor) return;

    const formData = new FormData(event.currentTarget);
    submit(
      {
        content: editor.getJSON(),
        expiry: formData.get("expiry"),
      } as SubmitTarget,
      { method: "POST", action: "/s", encType: "application/json" },
    );
  }

  return (
    <div className="grid w-full max-w-[calc(65ch+0.25rem*20)] grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
      <img
        src={paperBoat}
        alt=""
        className="w-16 md:w-32 justify-self-start md:sticky md:top-4 rounded-xs"
      />
      <Form className="min-w-0 space-y-4" onSubmit={handleSubmit}>
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
          />
        </main>
        <aside className="flex justify-between gap-2">
          <Select aria-label="Expiry" defaultValue="tomorrow" name="expiry">
            <Select.Trigger></Select.Trigger>
            <Select.Popover>
              <Select.List>
                <Select.Item id={ShareExpiry.TOMORROW}>
                  Expire tomorrow
                </Select.Item>
                <Select.Item id={ShareExpiry.THREE_DAYS}>
                  Expire in 3 days
                </Select.Item>
                <Select.Item id={ShareExpiry.ONE_WEEK}>
                  Expire in 1 week
                </Select.Item>
                <Select.Item id={ShareExpiry.ONE_MONTH}>
                  Expire in 1 month
                </Select.Item>
                <Select.Item id={ShareExpiry.NEVER} isDisabled={true}>
                  Never expire
                </Select.Item>
              </Select.List>
            </Select.Popover>
          </Select>
          <Button
            className="inline-flex gap-1"
            type="submit"
            isDisabled={isEmpty || isSubmitting}
          >
            Share
            <MoveUpRightIcon className="size-4" />
          </Button>
        </aside>
      </Form>
    </div>
  );
}
