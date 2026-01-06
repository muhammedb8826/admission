"use client"

import * as React from "react"
import { IconSearch, IconX } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value)
  const debounceTimerRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue)
    }, debounceMs)
  }

  const handleClear = () => {
    setLocalValue("")
    onChange("")
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
          onClick={handleClear}
        >
          <IconX className="size-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}

