import { cva, type VariantProps } from "class-variance-authority";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

interface ButtonProps extends AriaButtonProps, VariantProps<typeof buttonStyle> {}

export function Button({ size, variant, className, ...rest }: ButtonProps) {
  return (
    <AriaButton
      className={buttonStyle({
        size: size,
        variant: variant,
        className: className,
      })}
      {...rest}
    />
  );
}

const buttonStyle = cva(
  ["inline-flex items-center justify-center border rounded-xs", "transition-colors duration-100"],
  {
    variants: {
      size: {
        xs: "px-2 h-6 text-xs *:[svg]:size-3 gap-0.5",
        "icon-xs": "size-6 *:[svg]:size-3",
        sm: "px-3 h-8 text-sm *:[svg]:size-4 gap-1",
        "icon-sm": "size-8 *:[svg]:size-4",
        md: "px-4 h-10 text-sm *:[svg]:size-4 gap-1",
        "icon-md": "size-10 *:[svg]:size-4",
        icon: "size-10 *:[svg]:size-4",
      },
      variant: {
        solid: [
          "border-transparent",
          "uppercase font-light tracking-wider",
          "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950",
          "disabled:bg-zinc-900/30 dark:disabled:bg-zinc-100/30",
          "hover:not-disabled:bg-zinc-800 dark:hover:not-disabled:bg-zinc-300",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
        ],
        outlined: [
          "border-zinc-600 dark:border-zinc-400",
          "text-zinc-900 dark:text-zinc-200",
          "disabled:border-zinc-600/30 disabled:text-zinc-900/30 dark:disabled:border-zinc-400/30 dark:disabled:text-zinc-200/30",
          "hover:not-disabled:bg-zinc-900/10 dark:hover:not-disabled:bg-zinc-300/10",
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
