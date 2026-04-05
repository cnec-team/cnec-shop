"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
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

function buildCalendarDays(viewDate: Date) {
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  return eachDayOfInterval({ start: calStart, end: calEnd })
}

function MonthYearHeader({
  viewDate,
  onPrev,
  onNext,
}: {
  viewDate: Date
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-[14px] font-semibold text-gray-900">
        {format(viewDate, "yyyy년 M월", { locale: ko })}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  )
}

function CalendarGrid({
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
    <>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="flex items-center justify-center h-8 text-[12px] font-medium text-gray-400"
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
                "flex items-center justify-center h-8 w-full text-[13px] rounded-md transition-colors",
                !inMonth && "text-gray-300",
                inMonth && !selected && !today && "text-gray-700 hover:bg-gray-100",
                today && !selected && "bg-gray-100 text-gray-900 font-semibold",
                selected && "bg-blue-600 text-white font-semibold",
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </>
  )
}

/* ─── Time Spinner Column ────────────────────────── */

function TimeColumn({
  items,
  value,
  onChange,
  className,
}: {
  items: { label: string; value: number | string }[]
  value: number | string
  onChange: (v: number | string) => void
  className?: string
}) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const itemRefs = React.useRef<Map<number | string, HTMLButtonElement>>(new Map())

  React.useEffect(() => {
    const el = itemRefs.current.get(value)
    if (el && listRef.current) {
      const container = listRef.current
      const scrollTop = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2
      container.scrollTo({ top: scrollTop, behavior: "smooth" })
    }
  }, [value])

  return (
    <div
      ref={listRef}
      className={cn(
        "flex flex-col gap-0.5 h-[200px] overflow-y-auto scrollbar-thin px-1",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            ref={(el) => {
              if (el) itemRefs.current.set(item.value, el)
            }}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex items-center justify-center min-h-[36px] rounded-md text-[14px] font-medium transition-colors shrink-0",
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── DateTimePicker ─────────────────────────────── */

interface DateTimePickerProps {
  value: string // ISO datetime-local format: "2026-04-05T09:40"
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "연도. 월. 일. -- --:--",
  className,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const parsed = value ? new Date(value) : null
  const [viewDate, setViewDate] = React.useState(parsed || new Date())

  // Time state
  const [hours, setHours] = React.useState(() => {
    if (!parsed) return 9
    const h = parsed.getHours()
    return h === 0 ? 12 : h > 12 ? h - 12 : h
  })
  const [minutes, setMinutes] = React.useState(() =>
    parsed ? parsed.getMinutes() : 0,
  )
  const [isPM, setIsPM] = React.useState(() =>
    parsed ? parsed.getHours() >= 12 : true,
  )
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(parsed)

  // Sync external value changes
  React.useEffect(() => {
    if (value) {
      const d = new Date(value)
      setSelectedDate(d)
      setViewDate(d)
      const h = d.getHours()
      setHours(h === 0 ? 12 : h > 12 ? h - 12 : h)
      setMinutes(d.getMinutes())
      setIsPM(h >= 12)
    }
  }, [value])

  function emitChange(date: Date | null, h: number, m: number, pm: boolean) {
    if (!date) return
    const d = new Date(date)
    let hour24 = h
    if (pm && h !== 12) hour24 = h + 12
    if (!pm && h === 12) hour24 = 0
    d.setHours(hour24, m, 0, 0)
    const iso = format(d, "yyyy-MM-dd'T'HH:mm")
    onChange(iso)
  }

  function handleSelectDate(d: Date) {
    setSelectedDate(d)
    emitChange(d, hours, minutes, isPM)
  }

  function handleHoursChange(v: number | string) {
    const h = v as number
    setHours(h)
    emitChange(selectedDate, h, minutes, isPM)
  }

  function handleMinutesChange(v: number | string) {
    const m = v as number
    setMinutes(m)
    emitChange(selectedDate, hours, m, isPM)
  }

  function handleAmPmChange(v: number | string) {
    const pm = v === "PM"
    setIsPM(pm)
    emitChange(selectedDate, hours, minutes, pm)
  }

  function handleToday() {
    const now = new Date()
    setSelectedDate(now)
    setViewDate(now)
    const h = now.getHours()
    const newH = h === 0 ? 12 : h > 12 ? h - 12 : h
    setHours(newH)
    setMinutes(now.getMinutes())
    setIsPM(h >= 12)
    emitChange(now, newH, now.getMinutes(), h >= 12)
  }

  function handleClear() {
    setSelectedDate(null)
    onChange("")
  }

  const hourItems = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1).padStart(2, "0"),
    value: i + 1,
  }))

  const minuteItems = Array.from({ length: 60 }, (_, i) => ({
    label: String(i).padStart(2, "0"),
    value: i,
  }))

  const ampmItems = [
    { label: "오전", value: "AM" as string },
    { label: "오후", value: "PM" as string },
  ]

  const displayValue = parsed
    ? format(parsed, "yyyy. MM. dd. a hh:mm", { locale: ko })
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
        className="w-auto p-0 border border-gray-200 shadow-lg rounded-xl"
      >
        <div className="flex">
          {/* Calendar section */}
          <div className="p-4 border-r border-gray-100" style={{ width: 280 }}>
            <MonthYearHeader
              viewDate={viewDate}
              onPrev={() => setViewDate((d) => subMonths(d, 1))}
              onNext={() => setViewDate((d) => addMonths(d, 1))}
            />
            <CalendarGrid
              viewDate={viewDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClear}
                className="text-[13px] text-blue-600 hover:text-blue-700 font-medium"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="text-[13px] text-blue-600 hover:text-blue-700 font-medium"
              >
                오늘
              </button>
            </div>
          </div>
          {/* Time spinner section */}
          <div className="p-4 flex gap-1" style={{ width: 200 }}>
            <TimeColumn
              items={hourItems}
              value={hours}
              onChange={handleHoursChange}
              className="flex-1"
            />
            <TimeColumn
              items={minuteItems}
              value={minutes}
              onChange={handleMinutesChange}
              className="flex-1"
            />
            <TimeColumn
              items={ampmItems}
              value={isPM ? "PM" : "AM"}
              onChange={handleAmPmChange}
              className="flex-1"
            />
          </div>
        </div>
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
        className="w-auto p-0 border border-gray-200 shadow-lg rounded-xl"
      >
        <div className="p-4" style={{ width: 280 }}>
          <MonthYearHeader
            viewDate={viewDate}
            onPrev={() => setViewDate((d) => subMonths(d, 1))}
            onNext={() => setViewDate((d) => addMonths(d, 1))}
          />
          <CalendarGrid
            viewDate={viewDate}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
          {/* Footer */}
          <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleThisMonth}
              className="text-[13px] text-gray-600 hover:text-gray-800 font-medium border border-gray-200 rounded-md px-3 py-1.5"
            >
              이번달
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
