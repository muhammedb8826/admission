"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Input } from "./input";

export type SearchableOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
  disabled,
  id,
}: SearchableSelectProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(
    () =>
      options.filter((opt) =>
        opt.label.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [options, search]
  );

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div
          className="px-2 pb-1"
          onPointerDown={(e) => {
            // Prevent the select from closing when interacting with the search input
            e.stopPropagation();
          }}
        >
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              // Avoid the select typeahead / close behaviour while typing
              e.stopPropagation();
            }}
            className="h-8"
          />
        </div>
        {filtered.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No results found
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
