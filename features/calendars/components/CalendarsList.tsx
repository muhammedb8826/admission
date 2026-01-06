"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconRefresh, IconEye } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"

import type { CalendarTableRow, CalendarListItem } from "../types/calendar.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { SearchInput } from "@/components/search-input"
import { toast } from "sonner"

import { fetchCalendarList } from "../services/calendar.service"
import Link from "next/link"

export function CalendarsList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [calendars, setCalendars] = React.useState<CalendarListItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Fetch calendars
  const loadCalendars = async () => {
    try {
      setIsLoading(true)
      const data = await fetchCalendarList()
      setCalendars(data)
    } catch {
      toast.error("Failed to load calendars")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadCalendars()
  }, [])

  // Filter based on search term
  const filteredCalendars: CalendarTableRow[] = calendars
    .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      program: c.program?.name || "—",    // flatten program to string
      batch: c.batch?.name || "—",        // flatten batch to string
      academicYear: c.academicYearRange,
      status: c.isActive ? "Active" : "Inactive",
      semestersCount: c.semesters?.length ?? 0,
    }))

  // Table columns
  const columns: ColumnDef<CalendarTableRow>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Calendar Name",
        cell: ({ row }) => <Link href={`/dashboard/calendar/${row.original.slug}`} className="font-medium hover:underline hover:text-primary/80">{row.original.name}</Link>,
      },
      {
        accessorKey: "program",
        header: "Program",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.program}</span>
        ),
      },
      {
        accessorKey: "batch",
        header: "Batch",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.batch}</span>
        ),
      },
      {
        accessorKey: "academicYear",
        header: "Academic Year",
        cell: ({ row }) => <span className="text-sm">{row.original.academicYear}</span>,
      },
      {
        accessorKey: "semestersCount",
        header: "Semesters",
        cell: ({ row }) => <span className="text-sm">{row.original.semestersCount}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "Active" ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/calendar/${row.original.slug}`)}
            >
              <IconEye className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  )

  return (
    <div className="space-y-4 md:-space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <SearchInput
            placeholder="Search calendars..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="max-w-sm"
          />
          <Button variant="outline" size="icon" onClick={loadCalendars} title="Refresh">
            <IconRefresh className="size-4" />
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredCalendars}
        columns={columns}
        enableRowSelection={false}
        enableColumnVisibility={true}
        enablePagination={true}
        enableSorting={true}
        enableGlobalFilter={false}
        initialPageSize={10}
        getRowId={(row) => row.id}
        loading={isLoading}
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm font-medium">No calendars found.</p>
            {searchTerm && (
              <p className="text-muted-foreground text-xs mt-2">
                Try adjusting your search terms.
              </p>
            )}
          </div>
        }
      />
    </div>
  )
}
