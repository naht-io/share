import { cx } from "class-variance-authority";
import {
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
} from "react-aria-components";

export interface PopoverProps extends AriaPopoverProps {}

export function Popover(props: PopoverProps) {
  return (
    <AriaPopover
      className={cx(
        "min-w-(--trigger-width) origin-top rounded-xs shadow-lg",
        "border border-zinc-300 dark:border-zinc-700",
        "bg-zinc-50 dark:bg-zinc-950",
        "transition-[scale,opacity] ease-out",
        "data-entering:scale-95 data-entering:opacity-0 data-entering:duration-100",
        "data-exiting:scale-95 data-exiting:opacity-0 data-exiting:duration-100",
      )}
      {...props}
    />
  );
}
