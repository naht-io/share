import { cva, cx, type VariantProps } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import {
  Select as AriaSelect,
  Button,
  ListBox,
  ListBoxItem,
  SelectValue,
  type SelectProps as AriaSelectProps,
  type ListBoxItemProps,
  type ListBoxProps,
  type SelectValueProps,
} from "react-aria-components";

import { Popover } from "./Popover";

export interface SelectProps<T, M extends "single" | "multiple"> extends AriaSelectProps<T, M> {}

function Select<T, M extends "single" | "multiple">(props: SelectProps<T, M>) {
  return <AriaSelect {...props}></AriaSelect>;
}

export interface SelectTriggerProps<T>
  extends VariantProps<typeof selectTriggerStyle>, SelectValueProps<T> {}

function SelectTrigger<T>({ variant, size, ...props }: SelectTriggerProps<T>) {
  return (
    <Button className={selectTriggerStyle({ variant, size })}>
      <SelectValue {...props} />
      <ChevronDownIcon />
    </Button>
  );
}

const selectTriggerStyle = cva(
  [
    "inline-flex items-center justify-center",
    "whitespace-nowrap",
    "border rounded-xs",
    "transition-[background-color,box-shadow] duration-100",
  ],
  {
    variants: {
      size: {
        xs: "px-2 h-6 text-xs *:[svg]:size-3 gap-1",
        sm: "px-3 h-8 text-sm *:[svg]:size-4 gap-2",
        md: "px-4 h-10 text-sm *:[svg]:size-4 gap-2",
      },
      variant: {
        solid: [
          "border-transparent",
          "text-zinc-900 dark:text-zinc-200",
          "bg-zinc-300 dark:bg-zinc-700",
          "hover:not-disabled:bg-zinc-300/80 dark:hover:not-disabled:bg-zinc-700/80",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
        ],
        text: [
          "border-transparent",
          "text-zinc-900 dark:text-zinc-200",
          "disabled:text-zinc-900/30 dark:disabled:text-zinc-200/30",
          "hover:not-disabled:bg-zinc-900/10 dark:hover:not-disabled:bg-zinc-300/10",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
        ],
      },
    },
    defaultVariants: {
      size: "md",
      variant: "solid",
    },
  },
);

function SelectList<T>(props: ListBoxProps<T>) {
  return <ListBox className="flex flex-col" {...props} />;
}

function SelectItem<T>(props: ListBoxItemProps<T>) {
  return (
    <ListBoxItem
      className={cx(
        "px-3 py-2 text-sm",
        "text-zinc-900 dark:text-zinc-200",
        "data-disabled:text-zinc-900/50 dark:data-disabled:text-zinc-200/50",
        "outline-0",
        "data-focused:not-disabled:bg-zinc-900/5 dark:data-focused:not-disabled:bg-zinc-200/5",
        "transition-[background-color] duration-100",
      )}
      {...props}
    />
  );
}

type Select = typeof Select & {
  Trigger: typeof SelectTrigger;
  Popover: typeof Popover;
  List: typeof SelectList;
  Item: typeof SelectItem;
};
const select = Select as Select;
select.Trigger = SelectTrigger;
select.Popover = Popover;
select.List = SelectList;
select.Item = SelectItem;
export { select as Select };
