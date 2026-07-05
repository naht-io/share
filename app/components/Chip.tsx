import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ElementType } from "react";

export type ChipProps<T extends ElementType = "span"> = {
  /** Element to render, e.g. `"a"` for a link chip. Defaults to `"span"`. */
  as?: T;
  className?: string;
} & VariantProps<typeof chipStyle> &
  Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Chip<T extends ElementType = "span">({
  as,
  interactive,
  className,
  ...rest
}: ChipProps<T>) {
  const Component: ElementType = as ?? "span";
  return <Component className={chipStyle({ interactive, className })} {...rest} />;
}

const chipStyle = cva(
  [
    "inline-flex items-center gap-1.5 select-none",
    "rounded-xs px-1.5 py-1 text-sm",
    "bg-zinc-200 dark:bg-zinc-700",
  ],
  {
    variants: {
      interactive: {
        true: [
          "text-inherit no-underline",
          "transition-colors duration-100",
          "hover:bg-zinc-300 dark:hover:bg-zinc-600",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-zinc-200 dark:focus-visible:outline-zinc-700",
        ],
      },
    },
    defaultVariants: {
      interactive: false,
    },
  },
);
