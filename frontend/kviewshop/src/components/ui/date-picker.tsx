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
  showTime?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'YYYY. MM. DD.',
  disabled = false,
  minDate,
  maxDate,
  helperText,
  showTime = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(value ?? new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
  const [hour, setHour] = React.useState<number>(value ? value.getHours() : 0);
  const [minute, setMinute] = React.useState<number>(value ? value.getMinutes() : 0);

  React.useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setHour(value.getHours());
      setMinute(value.getMinutes());
    }
  }, [value]);

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
            {value
              ? showTime
                ? format(value, 'yyyy. MM. dd. HH:mm')
                : format(value, 'yyyy. MM. dd.')
              : placeholder}
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
              if (!showTime) {
                onChange(date);
                setOpen(false);
              } else if (date) {
                const d = new Date(date);
                d.setHours(hour, minute, 0, 0);
                setSelectedDate(d);
                onChange(d);
              }
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

          {/* Time Picker */}
          {showTime && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1">
                  <select
                    value={hour}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      setHour(h);
                      if (selectedDate) {
                        const d = new Date(selectedDate);
                        d.setHours(h, minute, 0, 0);
                        setSelectedDate(d);
                        onChange(d);
                      }
                    }}
                    className="h-9 w-16 rounded-lg border border-gray-200 bg-white text-center text-[14px] text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 appearance-none cursor-pointer"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <span className="text-[13px] text-gray-500">시</span>
                </div>
                <span className="text-gray-300 text-lg font-light">:</span>
                <div className="flex items-center gap-1">
                  <select
                    value={minute}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setMinute(m);
                      if (selectedDate) {
                        const d = new Date(selectedDate);
                        d.setHours(hour, m, 0, 0);
                        setSelectedDate(d);
                        onChange(d);
                      }
                    }}
                    className="h-9 w-16 rounded-lg border border-gray-200 bg-white text-center text-[14px] text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 appearance-none cursor-pointer"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <span className="text-[13px] text-gray-500">분</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={!selectedDate}
                className={cn(
                  'mt-3 w-full h-9 rounded-lg text-[13px] font-medium transition-colors',
                  selectedDate
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                )}
              >
                확인
              </button>
            </div>
          )}

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
