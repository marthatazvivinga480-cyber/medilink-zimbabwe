import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  label: string;
  onClose: () => void;
  busy?: boolean;
};
export default function Dialog({
  children,
  label,
  onClose,
  busy = false,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      aria-modal="true"
      className="app-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
