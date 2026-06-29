import { cva, type VariantProps } from "class-variance-authority";
import {
  ToggleButton as AriaToggleButton,
  type ToggleButtonProps as AriaToggleButtonProps,
} from "react-aria-components";

interface ToggleButtonProps
  extends AriaToggleButtonProps, Omit<VariantProps<typeof toggleButtonStyle>, "isSelected"> {}

export function ToggleButton(props: ToggleButtonProps) {
  const { size, variant, width, className, ...rest } = props;
  return (
    <AriaToggleButton
      {...rest}
      className={(renderProps) =>
        toggleButtonStyle({
          size,
          variant,
          width,
          isSelected: renderProps.isSelected,
          className: typeof className === "function" ? className(renderProps) : className,
        })
      }
    />
  );
}

const toggleButtonStyle = cva(
  ["inline-flex items-center justify-center border rounded-xs", "transition-colors duration-100"],
  {
    variants: {
      size: {
        sm: "px-3 h-8 text-sm",
        md: "px-4 h-10 text-sm",
        "icon-sm": "size-8",
        "icon-md": "size-10",
        icon: "size-10",
      },
      variant: {
        text: [
          "border-transparent",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
        ],
      },
      width: {
        default: "",
      },
      isSelected: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "text",
        isSelected: false,
        className: [
          "text-zinc-900 dark:text-zinc-200",
          "disabled:text-zinc-900/30 dark:disabled:text-zinc-200/30",
          "hover:not-disabled:bg-zinc-900/10 dark:hover:not-disabled:bg-zinc-300/10",
        ],
      },
      {
        variant: "text",
        isSelected: true,
        className: [
          "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950",
          "disabled:bg-zinc-900/30 dark:disabled:bg-zinc-100/30",
          "hover:not-disabled:bg-zinc-800 dark:hover:not-disabled:bg-zinc-300",
        ],
      },
    ],
    defaultVariants: {
      size: "md",
      variant: "text",
      width: "default",
    },
  },
);
