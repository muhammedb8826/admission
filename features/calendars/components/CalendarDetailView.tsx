"use client"

import { Badge } from "@/components/ui/badge"
import type { CalendarListItem, SemesterItem } from "../types/calendar.types"

type CalendarDetailViewProps = {
  calendarDetail: CalendarListItem
}

// Helper: get months between two dates
function getMonthsBetween(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const months: { year: number; month: number }[] = []

  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

  while (current <= last) {
    months.push({ year: current.getFullYear(), month: current.getMonth() })
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

// Helper: check if date is in a range
function isInRange(date: Date, start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return date >= startDate && date <= endDate
}

export function CalendarDetailView({ calendarDetail }: CalendarDetailViewProps) {
  if (!calendarDetail) {
    return <p className="text-sm text-muted-foreground">No calendar detail found</p>
  }

  const today = new Date()
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  // Generate months between start and end
  const months = getMonthsBetween(calendarDetail.startDate, calendarDetail.endDate)

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">{calendarDetail.name}</h2>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
          {calendarDetail.program && (
            <span>Program: {calendarDetail.program.name}</span>
          )}
          {calendarDetail.batch && (
            <span>
              Batch: {calendarDetail.batch.name} ({calendarDetail.batch.startYear}–{calendarDetail.batch.endYear})
            </span>
          )}
          {calendarDetail.isActive && <Badge variant="default">Active</Badge>}
        </div>
      </div>

      {/* Months */}
      <div className="grid gap-8 lg:grid-cols-2">
        {months.map(({ year, month }) => {
          const firstDay = new Date(year, month, 1)
          const lastDay = new Date(year, month + 1, 0)
          const daysInMonth = lastDay.getDate()
          const startingDay = firstDay.getDay()

          const days: (number | null)[] = []
          for (let i = 0; i < startingDay; i++) days.push(null)
          for (let d = 1; d <= daysInMonth; d++) days.push(d)

          return (
            <div key={`${year}-${month}`} className="border rounded-md">
              {/* Month Header */}
              <div className="px-4 py-2 border-b font-semibold">
                {monthNames[month]} {year}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-1 p-2 text-center text-xs">
                {weekDays.map((day) => (
                  <div key={day} className="font-medium text-muted-foreground">{day}</div>
                ))}

                {days.map((day, idx) => {
                  if (!day) return <div key={idx} />

                  const date = new Date(year, month, day)
                  const isToday = date.toDateString() === today.toDateString()

                  const semester: SemesterItem | undefined = calendarDetail.semesters.find(
                    (sem) => isInRange(date, sem.startDate, sem.endDate)
                  )

                  return (
                    <div
                      key={idx}
                      className={`
                        h-14 p-1 border rounded
                        ${semester ? "bg-blue-100 border-blue-300" : ""}
                        ${isToday ? "border-primary font-semibold" : ""}
                      `}
                    >
                      <div>{day}</div>
                      {semester && (
                        <div className="text-[10px] text-blue-700 truncate">{semester.name}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
