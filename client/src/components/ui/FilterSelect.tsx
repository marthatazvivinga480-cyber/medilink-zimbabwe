import {
  Check,
  ChevronDown,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

interface FilterSelectProps {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}

export default function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);

  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  function selectOption(option: string) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        aria-expanded={open}
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm font-medium transition ${
          open
            ? "border-teal ring-2 ring-teal/10"
            : "border-[#DCE5E8] hover:border-[#AFCED3]"
        }`}
      >
        <span
          className={
            value
              ? "text-navy"
              : "text-[#647583]"
          }
        >
          {value || placeholder}
        </span>

        <ChevronDown
          className={`h-4 w-4 text-navy transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-[#DCE5E8] bg-white p-1.5 shadow-[0_16px_40px_rgba(13,45,74,0.12)]">
          <div className="scrollbar-hide max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() =>
                selectOption("")
              }
              className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-sm transition ${
                value === ""
                  ? "bg-[#EAF8FA] font-semibold text-teal"
                  : "text-navy hover:bg-[#F5FAFB]"
              }`}
            >
              {placeholder}

              {value === "" && (
                <Check className="h-4 w-4 text-teal" />
              )}
            </button>

            {options.map((option) => {
              const selected =
                value === option;

              return (
                <button
                  type="button"
                  key={option}
                  onClick={() =>
                    selectOption(option)
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-sm transition ${
                    selected
                      ? "bg-[#EAF8FA] font-semibold text-teal"
                      : "text-navy hover:bg-[#F5FAFB]"
                  }`}
                >
                  {option}

                  {selected && (
                    <Check className="h-4 w-4 text-teal" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}