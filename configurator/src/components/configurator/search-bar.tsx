"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes into local state
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setLocalValue(next);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChange(next);
      }, 300);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onChange("");
  }, [onChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder="Search agents by name, division, or description..."
        value={localValue}
        onChange={handleChange}
        className="pl-8 pr-8"
      />
      {localValue.length > 0 && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <X className="size-3.5" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}
