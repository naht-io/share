import { cx } from "class-variance-authority";
import { Input as AriaInput, type InputProps as AriaInputProps } from "react-aria-components";

export interface InputProps extends Omit<AriaInputProps, "className"> {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <AriaInput
      className={cx(
        "h-8 w-full rounded-xs border px-2 text-sm",
        "border-zinc-300 dark:border-zinc-700",
        "bg-zinc-50 dark:bg-zinc-900",
        "text-zinc-950 dark:text-zinc-100",
        "placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
        "disabled:opacity-50",
        "focus:outline-2 focus:outline-offset-1",
        "focus:outline-zinc-900 dark:focus:outline-zinc-100",
        className,
      )}
      {...props}
    />
  );
}
