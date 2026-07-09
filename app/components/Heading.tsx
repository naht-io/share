import { cx } from "class-variance-authority";
import {
  Heading as AriaHeading,
  type HeadingProps as AriaHeadingProps,
} from "react-aria-components";

export interface HeadingProps extends AriaHeadingProps {}

export function Heading({ className, ...props }: HeadingProps) {
  return <AriaHeading className={cx("mb-4 text-sm font-bold", className)} {...props} />;
}
