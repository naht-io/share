import { cx } from "class-variance-authority";
import {
  Dialog as AriaDialog,
  type DialogProps as AriaDialogProps,
  DialogTrigger,
  Modal,
  ModalOverlay,
  type ModalOverlayProps,
} from "react-aria-components";

import { Heading } from "./Heading";

export interface DialogProps extends Omit<ModalOverlayProps, "children"> {
  children?: AriaDialogProps["children"];
}

function Dialog({ children, ...props }: DialogProps) {
  return (
    <ModalOverlay
      isDismissable={true}
      className={cx(
        "fixed inset-0 z-10 grid place-items-center p-4",
        "bg-zinc-950/30 dark:bg-zinc-950/60",
        "transition-opacity ease-out",
        "data-entering:opacity-0 data-entering:duration-100",
        "data-exiting:opacity-0 data-exiting:duration-100",
      )}
      {...props}
    >
      <Modal
        className={cx(
          "w-full max-w-sm rounded-xs shadow-lg",
          "border border-zinc-300 dark:border-zinc-700",
          "bg-zinc-50 dark:bg-zinc-950",
          "transition-[scale,opacity] ease-out",
          "data-entering:scale-95 data-entering:opacity-0 data-entering:duration-100",
          "data-exiting:scale-95 data-exiting:opacity-0 data-exiting:duration-100",
        )}
      >
        <AriaDialog className="p-4 outline-0 text-zinc-900 dark:text-zinc-200">
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}

type Dialog = typeof Dialog & {
  Trigger: typeof DialogTrigger;
  Heading: typeof Heading;
};
const dialog = Dialog as Dialog;
dialog.Trigger = DialogTrigger;
dialog.Heading = Heading;
export { dialog as Dialog };
