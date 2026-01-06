"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  Updater,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export interface TabConfig {
  value: string
  label: string
  badge?: number | string
  content?: React.ReactNode
}

export interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  // Tabs configuration
  tabs?: TabConfig[]
  defaultTab?: string
  onTabChange?: (value: string) => void
  // Features
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  enablePagination?: boolean
  enableSorting?: boolean
  enableGlobalFilter?: boolean
  // Customization
  addButton?: {
    label: string
    onClick: () => void
  }
  toolbarLeft?: React.ReactNode
  toolbarRight?: React.ReactNode
  getRowId?: (row: TData) => string
  onRowClick?: (row: TData) => void
  // States
  loading?: boolean
  error?: string | null
  emptyState?: React.ReactNode
  // Pagination
  initialPageSize?: number
  pageSizes?: number[]
  // Server-side pagination
  manualPagination?: boolean
  pageCount?: number
  totalItems?: number // Total count for server-side pagination
  onPaginationChange?: (updater: Updater<PaginationState>) => void
  state?: {
    pagination?: PaginationState
  }
}

export function DataTable<TData>({
  data,
  columns,
  tabs,
  defaultTab,
  onTabChange,
  enableRowSelection = false,
  enableColumnVisibility = true,
  enablePagination = true,
  enableSorting = true,
  enableGlobalFilter = false,
  addButton,
  toolbarLeft,
  toolbarRight,
  getRowId,
  onRowClick,
  loading = false,
  error = null,
  emptyState,
  initialPageSize = 10,
  pageSizes = [10, 20, 30, 40, 50],
  manualPagination = false,
  pageCount,
  totalItems,
  onPaginationChange: externalOnPaginationChange,
  state: externalState,
}: DataTableProps<TData>) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [rowSelection, setRowSelection] = React.useState({})
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const [globalFilter, setGlobalFilter] = React.useState("")

  // Use external pagination state if provided (for server-side pagination), otherwise use internal
  const pagination = externalState?.pagination ?? internalPagination
  const setPagination = externalOnPaginationChange ?? setInternalPagination

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: enableSorting ? sorting : undefined,
      columnVisibility: enableColumnVisibility ? columnVisibility : undefined,
      columnFilters: enableGlobalFilter ? columnFilters : undefined,
      rowSelection: enableRowSelection ? rowSelection : undefined,
      pagination: enablePagination ? pagination : undefined,
      globalFilter: enableGlobalFilter ? globalFilter : undefined,
    },
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnVisibilityChange: enableColumnVisibility
      ? setColumnVisibility
      : undefined,
    onColumnFiltersChange: enableGlobalFilter
      ? setColumnFilters
      : undefined,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    onPaginationChange: enablePagination ? setPagination : undefined,
    onGlobalFilterChange: enableGlobalFilter ? setGlobalFilter : undefined,
    getRowId: getRowId,
    enableRowSelection: enableRowSelection,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: enableGlobalFilter
      ? getFilteredRowModel()
      : undefined,
    getPaginationRowModel: enablePagination && !manualPagination
      ? getPaginationRowModel()
      : undefined,
    manualPagination: manualPagination,
    pageCount: manualPagination && pageCount !== undefined ? pageCount : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFacetedRowModel: enableGlobalFilter ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableGlobalFilter
      ? getFacetedUniqueValues()
      : undefined,
  })

  const defaultTabValue = defaultTab || (tabs && tabs.length > 0 ? tabs[0].value : undefined)
  const hasTabs = tabs && tabs.length > 0
  const [internalActiveTab, setInternalActiveTab] = React.useState(defaultTabValue || "")
  
  const handleTabChange = (value: string) => {
    setInternalActiveTab(value)
    onTabChange?.(value)
  }
  
  const currentTab = onTabChange ? internalActiveTab : undefined

  const renderTable = () => (
    <>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {loading ? (
              Array.from({ length: pagination.pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    enableRowSelection && row.getIsSelected() && "selected"
                  }
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyState || "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {enableRowSelection
              ? `${table.getFilteredSelectedRowModel().rows.length} of `
              : ""}
            {manualPagination && totalItems !== undefined
              ? totalItems
              : table.getRowModel().rows.length}{" "}
            row(s)
            {enableRowSelection ? " selected." : "."}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              {mounted ? (
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    const newPageSize = Number(value)
                    if (manualPagination && externalOnPaginationChange) {
                      externalOnPaginationChange((old: PaginationState) => ({
                        ...old,
                        pageSize: newPageSize,
                        pageIndex: 0, // Reset to first page when page size changes
                      }))
                    } else {
                      table.setPageSize(newPageSize)
                    }
                  }}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {pageSizes.map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-8 w-20 rounded-md border bg-background" />
              )}
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  const renderContent = () => {
    if (hasTabs) {
      return (
        <Tabs
          value={onTabChange ? currentTab : undefined}
          defaultValue={!onTabChange ? defaultTabValue : undefined}
          onValueChange={onTabChange ? handleTabChange : undefined}
          className="w-full flex-col justify-start gap-6"
        >
          <div className="flex items-center justify-between">
            <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  {tab.badge !== undefined && (
                    <Badge variant="secondary">{tab.badge}</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex-1" />
          </div>
          {(toolbarLeft || toolbarRight || enableColumnVisibility || addButton) && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {toolbarLeft && (
                <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">{toolbarLeft}</div>
              )}
              {!toolbarLeft && <div className="flex-1" />}
              {toolbarRight && (
                <div className="flex items-center gap-2 shrink-0">{toolbarRight}</div>
              )}
              <div className="flex items-center gap-2 shrink-0">
                {enableColumnVisibility &&
                  (mounted ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <IconLayoutColumns />
                          <span className="hidden lg:inline">
                            Customize Columns
                          </span>
                          <span className="lg:hidden">Columns</span>
                          <IconChevronDown />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {table
                          .getAllColumns()
                          .filter(
                            (column) =>
                              typeof column.accessorFn !== "undefined" &&
                              column.getCanHide()
                          )
                          .map((column) => (
                            <DropdownMenuCheckboxItem
                              key={column.id}
                              className="capitalize"
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                              }
                            >
                              {column.id}
                            </DropdownMenuCheckboxItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <IconLayoutColumns />
                      <span className="hidden lg:inline">
                        Customize Columns
                      </span>
                      <span className="lg:hidden">Columns</span>
                      <IconChevronDown />
                    </Button>
                  ))}
                {addButton && (
                  <Button variant="default" size="sm" onClick={addButton.onClick} className="min-w-[100px] lg:min-w-0">
                    <IconPlus />
                    <span className="hidden lg:inline">{addButton.label}</span>
                  </Button>
                )}
              </div>
            </div>
          )}
          {tabs.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="relative flex flex-col gap-4 overflow-auto"
            >
              {error && (
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}
              {tab.content || renderTable()}
            </TabsContent>
          ))}
        </Tabs>
      )
    }

    return (
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {toolbarLeft && (
            <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">{toolbarLeft}</div>
          )}
          {!toolbarLeft && <div className="flex-1" />}
          {toolbarRight && (
            <div className="flex items-center gap-2 shrink-0">{toolbarRight}</div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {enableColumnVisibility &&
              (mounted ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <IconLayoutColumns />
                      <span className="hidden lg:inline">
                        Customize Columns
                      </span>
                      <span className="lg:hidden">Columns</span>
                      <IconChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {table
                      .getAllColumns()
                      .filter(
                        (column) =>
                          typeof column.accessorFn !== "undefined" &&
                          column.getCanHide()
                      )
                      .map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              ))}
            {addButton && (
              <Button variant="default" size="sm" onClick={addButton.onClick} className="min-w-[100px] lg:min-w-0">
                <IconPlus />
                <span className="hidden lg:inline">{addButton.label}</span>
              </Button>
            )}
          </div>
        </div>
        <div className="relative flex flex-col gap-4 overflow-auto">
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {renderTable()}
        </div>
      </div>
    )
  }

  return renderContent()
}

