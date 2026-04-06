'use client';

import * as React from 'react';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  helperText?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'YYYY. MM. DD.',
  disabled = false,
  minDate,
  maxDate,
  helperText,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(value ?? new Date());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 w-full h-12 px-4 rounded-[14px] border-[1.5px] text-[14px] transition-colors text-left',
            'border-gray-100 hover:border-gray-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-50',
            'bg-white outline-none',
            !value && 'text-gray-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="flex-1">
            {value ? format(value, 'yyyy. MM. dd.') : placeholder}
          </span>
          <ChevronRightIcon className={cn(
            'h-4 w-4 text-gray-400 transition-transform',
            open && 'rotate-90'
          )} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-xl border shadow-lg bg-white"
        align="start"
        sideOffset={8}
      >
        <div className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-[15px] font-bold text-gray-900">
              {format(month, 'yyyy.MM')}
            </span>
            <button
              type="button"
              onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Calendar */}
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
            month={month}
            onMonthChange={setMonth}
            locale={ko}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            showOutsideDays={false}
            classNames={{
              root: 'w-full',
              months: 'w-full',
              month: 'w-full',
              nav: 'hidden',
              month_caption: 'hidden',
              table: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'flex-1 text-center text-[13px] text-gray-400 font-normal pb-2',
              week: 'flex mt-1',
              day: 'flex-1 flex items-center justify-center',
              day_button: cn(
                'h-9 w-9 rounded-full text-[14px] font-normal transition-colors',
                'hover:bg-blue-50 hover:text-blue-600',
                'focus:outline-none focus:ring-2 focus:ring-blue-200'
              ),
              selected: '[&_.rdp-day_button]:bg-blue-600 [&_.rdp-day_button]:text-white [&_.rdp-day_button]:hover:bg-blue-700 [&_.rdp-day_button]:font-semibold',
              today: '[&_.rdp-day_button]:font-bold [&_.rdp-day_button]:text-blue-600',
              disabled: '[&_.rdp-day_button]:text-gray-200 [&_.rdp-day_button]:hover:bg-transparent [&_.rdp-day_button]:cursor-not-allowed',
              outside: 'text-gray-200',
            }}
            components={{
              Chevron: () => <></>,
            }}
          />

          {/* Helper text */}
          {helperText && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-orange-500 flex items-center gap-1">
                <span className="inline-block h-1 w-1 rounded-full bg-orange-400" />
                {helperText}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
