import { cx } from "class-variance-authority";
import { Label as AriaLabel, type LabelProps as AriaLabelProps } from "react-aria-components";

export interface LabelProps extends AriaLabelProps {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <AriaLabel
      className={cx("text-xs font-bold text-zinc-700 dark:text-zinc-300", className)}
      {...props}
    />
  );
}
