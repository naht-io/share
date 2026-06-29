import { cva, cx, type VariantProps } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  type MenuItemProps,
  type MenuProps,
  type MenuTriggerProps,
} from "react-aria-components";

import { Popover } from "./Popover";

export interface DropdownProps extends MenuTriggerProps {}

function Dropdown(props: DropdownProps) {
  return <MenuTrigger {...props} />;
}

export interface DropdownTriggerProps extends VariantProps<typeof dropdownTriggerStyle> {
  children?: React.ReactNode;
}

function DropdownTrigger({ variant, size, ...props }: DropdownTriggerProps) {
  return (
    <Button className={dropdownTriggerStyle({ variant, size })}>
      {props.children}
      <ChevronDownIcon className="size-4" />
    </Button>
  );
}

const dropdownTriggerStyle = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap",
    "border rounded-xs",
    "transition-[background-color,box-shadow] duration-100",
  ],
  {
    variants: {
      size: {
        sm: "px-3 h-8 text-sm",
        md: "px-4 h-10 text-sm",
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
      variant: "text",
    },
  },
);

export interface DropdownMenuProps<T> extends MenuProps<T> {}

function DropdownMenu<T>(props: DropdownMenuProps<T>) {
  return <Menu className="flex flex-col" {...props} />;
}

export interface DropdownMenuItemProps extends MenuItemProps {}

function DropdownMenuItem(props: DropdownMenuItemProps) {
  return (
    <MenuItem
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

type Dropdown = typeof Dropdown & {
  Trigger: typeof DropdownTrigger;
  Popover: typeof Popover;
  Menu: typeof DropdownMenu;
  MenuItem: typeof DropdownMenuItem;
};
const dropdown = Dropdown as Dropdown;
dropdown.Trigger = DropdownTrigger;
dropdown.Popover = Popover;
dropdown.Menu = DropdownMenu;
dropdown.MenuItem = DropdownMenuItem;
export { dropdown as Dropdown };
