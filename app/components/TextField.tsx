import { cx } from "class-variance-authority";
import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";

export interface TextFieldProps extends Omit<AriaTextFieldProps, "className"> {
  className?: string;
}

export function TextField({ className, ...props }: TextFieldProps) {
  return <AriaTextField className={cx("flex flex-col gap-1", className)} {...props} />;
}
