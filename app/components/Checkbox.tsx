import { cx } from "class-variance-authority";
import { CheckIcon } from "lucide-react";
import { CheckboxButton, type CheckboxButtonProps, CheckboxField } from "react-aria-components";

export interface CheckboxProps extends Omit<CheckboxButtonProps, "children" | "className"> {
  children?: React.ReactNode;
  className?: string;
}

function Checkbox({ children, className, ...props }: CheckboxProps) {
  return (
    <CheckboxButton
      className={cx(
        "group flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-200",
        className,
      )}
      {...props}
    >
      <span
        className={cx(
          "grid size-4 shrink-0 place-items-center rounded-xs border",
          "border-zinc-600 dark:border-zinc-400",
          "group-data-selected:border-transparent",
          "group-data-selected:bg-zinc-900 dark:group-data-selected:bg-zinc-100",
          "group-data-focus-visible:outline-2 group-data-focus-visible:outline-offset-2",
          "group-data-focus-visible:outline-zinc-900 dark:group-data-focus-visible:outline-zinc-100",
          "transition-colors duration-100",
        )}
      >
        <CheckIcon className="size-3 text-zinc-50 opacity-0 group-data-selected:opacity-100 dark:text-zinc-950" />
      </span>
      {children}
    </CheckboxButton>
  );
}

type Checkbox = typeof Checkbox & {
  Field: typeof CheckboxField;
};
const checkbox = Checkbox as Checkbox;
checkbox.Field = CheckboxField;
export { checkbox as Checkbox };
