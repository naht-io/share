import { Label as AriaLabel, type LabelProps as AriaLabelProps } from "react-aria-components";

export interface LabelProps extends AriaLabelProps {}

export function Label(props: LabelProps) {
  return <AriaLabel {...props} />;
}
