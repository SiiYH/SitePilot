'use client';

import * as React from 'react';
import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateInputProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  className?: string;
}

// A list of formats to try parsing. Add more formats as needed.
const DATE_FORMATS = [
  'yyyy-MM-dd',
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'dd-MM-yyyy',
  'MM-dd-yyyy',
  'd MMMM yyyy',
  'MMMM d, yyyy',
];

const DISPLAY_FORMAT = 'yyyy-MM-dd';

export function DateInput({
  value,
  onChange,
  disabled,
  placeholder = 'YYYY-MM-DD',
  className,
}: DateInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  // Update input value when the date prop changes
  React.useEffect(() => {
    if (value) {
      setInputValue(format(value, DISPLAY_FORMAT));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);

    // Try parsing the input text against all supported formats
    let parsedDate: Date | undefined;
    for (const fmt of DATE_FORMATS) {
      const parsed = parse(text, fmt, new Date());
      if (!isNaN(parsed.getTime())) {
        parsedDate = parsed;
        break;
      }
    }
    onChange(parsedDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setInputValue(format(date, DISPLAY_FORMAT));
    } else {
      onChange(undefined);
      setInputValue('');
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative w-full', className)}>
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            className="w-full h-11 pl-3 pr-10 text-left font-normal"
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
