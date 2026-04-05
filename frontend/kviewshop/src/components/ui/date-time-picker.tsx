"use client"

import * as React from "react"
import { CalendarIcon, RefreshCw } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { ko } from "date-fns/locale"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/* ─── Shared helpers ─────────────────────────────── */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`)

function buildCalendarDays(viewDate: Date) {
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  return eachDayOfInterval({ start: calStart, end: calEnd })
}

/* ─── Green Month Header ─────────────────────────── */

function GreenMonthHeader({
  viewDate,
  onPrevYear,
  onNextYear,
  onPrevMonth,
  onNextMonth,
}: {
  viewDate: Date
  onPrevYear: () => void
  onNextYear: () => void
  onPrevMonth: () => void
  onNextMonth: () => void
}) {
  return (
    <div className="flex items-center justify-between bg-[#4A9B8E] rounded-t-lg px-2 py-2.5">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onPrevYear}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-white/20 text-white text-[14px] font-bold"
        >
          «
        </button>
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-white/20 text-white text-[14px] font-bold"
        >
          ‹
        </button>
      </div>
      <span className="text-[14px] font-bold text-white">
        {format(viewDate, "yyyy.MM")}
      </span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onNextMonth}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-white/20 text-white text-[14px] font-bold"
        >
          ›
        </button>
        <button
          type="button"
          onClick={onNextYear}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-white/20 text-white text-[14px] font-bold"
        >
          »
        </button>
      </div>
    </div>
  )
}

/* ─── Calendar Day Grid ──────────────────────────── */

function CalendarDayGrid({
  viewDate,
  selectedDate,
  onSelectDate,
}: {
  viewDate: Date
  selectedDate: Date | null
  onSelectDate: (d: Date) => void
}) {
  const days = buildCalendarDays(viewDate)

  return (
    <div className="px-3 py-2">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="flex items-center justify-center h-8 text-[12px] font-semibold text-gray-500"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, viewDate)
          const selected = selectedDate && isSameDay(day, selectedDate)
          const today = isToday(day)

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex items-center justify-center h-8 w-full text-[13px] transition-colors",
                !inMonth && "text-gray-300",
                inMonth && !selected && !today && "text-gray-700 hover:bg-gray-100 rounded-md",
                today && !selected && "text-gray-900 font-semibold",
                selected && "bg-gray-200 text-gray-900 font-semibold rounded-full",
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Time Grid (0:00 ~ 23:00) ───────────────────── */

function TimeGrid({
  selectedDate,
  selectedHour,
  onSelectHour,
  onBack,
}: {
  selectedDate: Date
  selectedHour: number | null
  onSelectHour: (hour: number) => void
  onBack: () => void
}) {
  return (
    <div>
      {/* Header with date and refresh */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-400"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <span className="text-[14px] font-semibold text-gray-700">
          {format(selectedDate, "yyyy.MM.dd.")}
        </span>
        <div className="w-7" />
      </div>
      {/* Hour grid */}
      <div className="grid grid-cols-4 gap-1 p-3">
        {HOURS.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectHour(i)}
            className={cn(
              "flex items-center justify-center h-9 rounded-md text-[13px] transition-colors",
              selectedHour === i
                ? "bg-[#4A9B8E] text-white font-semibold"
                : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── DateTimePicker ─────────────────────────────── */

interface DateTimePickerProps {
  value: string // ISO datetime-local format: "2026-04-05T09:00"
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "연도. 월. 일. --:--",
  className,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<"date" | "time">("date")

  const parsed = value ? new Date(value) : null
  const [viewDate, setViewDate] = React.useState(parsed || new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(parsed)
  const [selectedHour, setSelectedHour] = React.useState<number | null>(
    parsed ? parsed.getHours() : null,
  )

  // Sync external value changes
  React.useEffect(() => {
    if (value) {
      const d = new Date(value)
      setSelectedDate(d)
      setViewDate(d)
      setSelectedHour(d.getHours())
    }
  }, [value])

  // Reset step when popover opens
  React.useEffect(() => {
    if (open) {
      setStep(selectedDate && selectedHour !== null ? "date" : "date")
    }
  }, [open])

  function handleSelectDate(d: Date) {
    setSelectedDate(d)
    setStep("time")
  }

  function handleSelectHour(hour: number) {
    setSelectedHour(hour)
    if (selectedDate) {
      const d = new Date(selectedDate)
      d.setHours(hour, 0, 0, 0)
      onChange(format(d, "yyyy-MM-dd'T'HH:mm"))
    }
    setOpen(false)
    setStep("date")
  }

  function handleThisMonth() {
    setViewDate(new Date())
  }

  const displayValue = parsed
    ? format(parsed, "yyyy. MM. dd. HH:mm")
    : ""

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep("date") }}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex items-center justify-between w-full h-12 rounded-[14px] border-[1.5px] border-gray-100 bg-white px-4 text-[14px] text-left transition-colors hover:border-gray-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-50 focus:outline-none",
            !displayValue && "text-gray-300",
            className,
          )}
        >
          <span>{displayValue || placeholder}</span>
          <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden"
      >
        {step === "date" ? (
          <div style={{ width: 280 }}>
            <GreenMonthHeader
              viewDate={viewDate}
              onPrevYear={() => setViewDate((d) => subYears(d, 1))}
              onNextYear={() => setViewDate((d) => addYears(d, 1))}
              onPrevMonth={() => setViewDate((d) => subMonths(d, 1))}
              onNextMonth={() => setViewDate((d) => addMonths(d, 1))}
            />
            <CalendarDayGrid
              viewDate={viewDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
            {/* Footer */}
            <div className="flex items-center justify-center px-3 pb-3">
              <button
                type="button"
                onClick={handleThisMonth}
                className="text-[13px] text-gray-500 hover:text-gray-700 font-medium border border-gray-200 rounded-full px-4 py-1.5"
              >
                이번달
              </button>
            </div>
          </div>
        ) : selectedDate ? (
          <div style={{ width: 280 }}>
            <TimeGrid
              selectedDate={selectedDate}
              selectedHour={selectedHour}
              onSelectHour={handleSelectHour}
              onBack={() => setStep("date")}
            />
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

/* ─── DatePicker (date-only, simpler variant) ────── */

interface DatePickerProps {
  value: string // "2026-04-05" format
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "연도. 월. 일.",
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const parsed = value ? new Date(value + "T00:00:00") : null
  const [viewDate, setViewDate] = React.useState(parsed || new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(parsed)

  React.useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00")
      setSelectedDate(d)
      setViewDate(d)
    }
  }, [value])

  function handleSelectDate(d: Date) {
    setSelectedDate(d)
    onChange(format(d, "yyyy-MM-dd"))
    setOpen(false)
  }

  function handleThisMonth() {
    setViewDate(new Date())
  }

  const displayValue = parsed
    ? format(parsed, "yyyy. MM. dd.", { locale: ko })
    : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex items-center justify-between w-full h-12 rounded-[14px] border-[1.5px] border-gray-100 bg-white px-4 text-[14px] text-left transition-colors hover:border-gray-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-50 focus:outline-none",
            !displayValue && "text-gray-300",
            className,
          )}
        >
          <span>{displayValue || placeholder}</span>
          <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden"
      >
        <div style={{ width: 280 }}>
          <GreenMonthHeader
            viewDate={viewDate}
            onPrevYear={() => setViewDate((d) => subYears(d, 1))}
            onNextYear={() => setViewDate((d) => addYears(d, 1))}
            onPrevMonth={() => setViewDate((d) => subMonths(d, 1))}
            onNextMonth={() => setViewDate((d) => addMonths(d, 1))}
          />
          <CalendarDayGrid
            viewDate={viewDate}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
          {/* Footer */}
          <div className="flex items-center justify-center px-3 pb-3">
            <button
              type="button"
              onClick={handleThisMonth}
              className="text-[13px] text-gray-500 hover:text-gray-700 font-medium border border-gray-200 rounded-full px-4 py-1.5"
            >
              이번달
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
