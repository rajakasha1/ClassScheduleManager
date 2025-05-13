import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

type Option = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [commandFocus, setCommandFocus] = React.useState(false);

  const handleSelect = React.useCallback(
    (option: Option) => {
      const isSelected = selected.includes(option.value);
      const newSelected = isSelected
        ? selected.filter((item) => item !== option.value)
        : [...selected, option.value];
      
      onChange(newSelected);
      setInputValue("");
    },
    [onChange, selected]
  );

  const handleRemove = React.useCallback(
    (item: string) => {
      onChange(selected.filter((i) => i !== item));
    },
    [onChange, selected]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "" && selected.length > 0) {
            handleRemove(selected[selected.length - 1]);
          }
        }
        // This prevents the command menu from closing when the input is empty
        if (e.key === "Escape") {
          input.blur();
          setOpen(false);
        }
      }
    },
    [selected, handleRemove]
  );

  // Function to get the display label for a value
  const getOptionLabel = (value: string): string => {
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const filteredOptions = React.useMemo(() => {
    return options.filter((option) => {
      // Filter out already selected items
      const alreadySelected = selected.includes(option.value);
      // Match input value
      const matchesInput = option.label.toLowerCase().includes(inputValue.toLowerCase());
      return !alreadySelected && matchesInput;
    });
  }, [inputValue, options, selected]);

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={`overflow-visible bg-white rounded-md border border-input ${className}`}
    >
      <div
        className="flex flex-wrap gap-1 p-1 group border border-input rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      >
        {selected.map((item) => (
          <Badge key={item} variant="secondary" className="rounded-sm px-1 py-0 h-fit">
            {getOptionLabel(item)}
            <button
              type="button"
              className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => handleRemove(item)}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              <span className="sr-only">Remove {getOptionLabel(item)}</span>
            </button>
          </Badge>
        ))}
        
        <CommandPrimitive.Input
          ref={inputRef}
          value={inputValue}
          onValueChange={setInputValue}
          onBlur={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? placeholder : ""}
          className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground h-8"
        />
      </div>
      
      <div className="relative">
        {open && filteredOptions.length > 0 && (
          <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-full overflow-auto max-h-[200px]">
              {filteredOptions.map((option) => {
                return (
                  <CommandItem
                    key={option.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => handleSelect(option)}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        )}
      </div>
    </Command>
  );
}
