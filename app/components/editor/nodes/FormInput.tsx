import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { PencilIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/Button";
import { Checkbox } from "~/components/Checkbox";
import { Dialog } from "~/components/Dialog";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { TextField } from "~/components/TextField";
import { maxNameLength, maxPlaceholderLength, maxValueLength } from "~/core/forms";
import { CustomNode } from "~/core/nodes";

import { useShareMode } from "../share-mode.context";

export const FormInput = Node.create({
  name: CustomNode.INPUT,
  atom: true,
  group: "block",

  addAttributes() {
    return {
      id: { default: null },
      name: { default: "" },
      placeholder: { default: "" },
      required: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-input]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-input": "" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FormInputView);
  },
});

function FormInputView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { id, name, placeholder, required } = node.attrs as {
    id: string;
    name: string;
    placeholder: string;
    required: boolean;
  };
  const shareMode = useShareMode();

  return (
    <NodeViewWrapper data-input="">
      {shareMode.mode === "form" ? (
        <ShowFormInputView id={id} name={name} placeholder={placeholder} required={required} />
      ) : shareMode.mode === "results" ? (
        <ResultsFormInputView
          name={name}
          required={required}
          values={shareMode.results[id] ?? []}
        />
      ) : (
        <EditFormInputView
          name={name}
          placeholder={placeholder}
          required={required}
          onUpdate={updateAttributes}
          onRemove={deleteNode}
        />
      )}
    </NodeViewWrapper>
  );
}

function ShowFormInputView({
  id,
  name,
  placeholder,
  required,
}: {
  id: string;
  name: string;
  placeholder: string;
  required: boolean;
}) {
  const inputId = `input:${id}`;
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={inputId}>
        {name}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-600 dark:text-red-400">
            *
          </span>
        )}
      </Label>
      <Input
        id={inputId}
        name={id}
        placeholder={placeholder}
        required={required}
        maxLength={maxValueLength}
      />
    </div>
  );
}

function ResultsFormInputView({
  name,
  required,
  values,
}: {
  name: string;
  required: boolean;
  values: string[];
}) {
  return (
    <div className="rounded-xs border border-zinc-300 dark:border-zinc-700">
      <div className="flex items-baseline justify-between gap-2 border-b border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
        <Label>
          {name || (
            <span className="font-normal italic text-zinc-500 dark:text-zinc-400">
              Unnamed field
            </span>
          )}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-red-600 dark:text-red-400">
              *
            </span>
          )}
        </Label>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {values.length} {values.length === 1 ? "response" : "responses"}
        </span>
      </div>
      {values.length > 0 ? (
        <ul className="max-h-40 overflow-y-auto px-2 py-1.5 text-sm">
          {values.map((value, index) => (
            <li key={index} className="wrap-break-word">
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 py-1.5 text-sm italic text-zinc-500 dark:text-zinc-400">
          No responses yet
        </p>
      )}
    </div>
  );
}

function EditFormInputView({
  name,
  placeholder,
  required,
  onUpdate,
  onRemove,
}: {
  name: string;
  placeholder: string;
  required: boolean;

  onUpdate: (attrs: { name: string; placeholder: string; required: boolean }) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Label>
          {name || (
            <span className="font-normal italic text-zinc-500 dark:text-zinc-400">
              Unnamed field
            </span>
          )}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-red-600 dark:text-red-400">
              *
            </span>
          )}
        </Label>
        <span className="ml-auto flex">
          <Dialog.Trigger>
            <Button size="icon-xs" variant="text" aria-label={`Edit ${name || "unnamed field"}`}>
              <PencilIcon />
            </Button>
            <Dialog>
              {({ close }) => (
                <EditDialog
                  attrs={{ name, placeholder, required }}
                  onSave={onUpdate}
                  close={close}
                />
              )}
            </Dialog>
          </Dialog.Trigger>
          <Button
            size="icon-xs"
            variant="text"
            aria-label={`Remove ${name || "unnamed field"}`}
            onPress={onRemove}
          >
            <XIcon />
          </Button>
        </span>
      </div>
      <Input disabled placeholder={placeholder} />
    </div>
  );
}

interface EditDialogProps {
  attrs: { name: string; placeholder: string; required: boolean };
  onSave: (attrs: { name: string; placeholder: string; required: boolean }) => void;
  close: () => void;
}

function EditDialog({ attrs, onSave, close }: EditDialogProps) {
  const [name, setName] = useState(attrs.name);
  const [placeholder, setPlaceholder] = useState(attrs.placeholder);
  const [required, setRequired] = useState(attrs.required);

  return (
    <>
      <Dialog.Heading slot="title">Edit input</Dialog.Heading>
      <div className="space-y-3">
        <TextField autoFocus value={name} onChange={setName} maxLength={maxNameLength}>
          <Label>Name</Label>
          <Input placeholder="What does this field ask?" />
        </TextField>
        <TextField value={placeholder} onChange={setPlaceholder} maxLength={maxPlaceholderLength}>
          <Label>Placeholder</Label>
          <Input placeholder="Example answer shown while empty" />
        </TextField>
        <Checkbox.Field isSelected={required} onChange={setRequired}>
          <Checkbox>Required</Checkbox>
        </Checkbox.Field>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="text" onPress={close}>
            Cancel
          </Button>
          <Button
            size="sm"
            onPress={() => {
              onSave({ name, placeholder, required });
              close();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </>
  );
}
