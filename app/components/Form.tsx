import { Form as AriaForm, type FormProps as AriaFormProps } from "react-aria-components";
import { Form as ReactRouterForm, type FormProps as ReactRouterFormProps } from "react-router";

export interface FormProps extends Omit<AriaFormProps, "method" | "encType" | "action"> {
  method?: ReactRouterFormProps["method"];
  action?: ReactRouterFormProps["action"];
  encType?: ReactRouterFormProps["encType"];
}

export function Form(props: FormProps) {
  const { method, encType, action, ...rest } = props;
  return (
    <AriaForm
      {...rest}
      render={(renderProps) => (
        <ReactRouterForm {...renderProps} method={method} encType={encType} action={action} />
      )}
    />
  );
}
