"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Search } from "lucide-react";
import { getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import { Program, ProgramsFilter } from "../types/programs.types";

type ProgramsListProps = {
  programs: Program[];
  initialFilter?: ProgramsFilter;
  showFilters?: boolean;
};

export function ProgramsList({ programs, initialFilter = "all", showFilters = true }: ProgramsListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());
  
  // When filters are hidden, use initialFilter directly. Otherwise, derive from URL params
  const getFilterFromUrl = (): ProgramsFilter => {
    const typeParam = searchParams.get("type");
    if (typeParam === "undergraduate" || typeParam === "graduate") {
      return typeParam;
    }
    return "all";
  };
  
  // When filters are shown, use URL-based filter. Otherwise, always use initialFilter
  const urlFilter = showFilters ? getFilterFromUrl() : null;
  const [filter, setFilter] = useState<ProgramsFilter>(urlFilter || initialFilter);

  const handleFilterChange = (newFilter: ProgramsFilter) => {
    setFilter(newFilter);
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter === "all") {
      params.delete("type");
    } else {
      params.set("type", newFilter);
    }
    router.push(`/programs${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  // Use initialFilter directly when filters are hidden, otherwise use state from URL
  const activeFilter = showFilters ? (urlFilter || filter) : initialFilter;
  
  // Filter by type
  const typeFilteredPrograms =
    activeFilter === "all"
      ? programs
      : programs.filter((p) => p.type === activeFilter);

  // Filter by search query
  const filteredPrograms = useMemo(() => {
    if (!searchQuery.trim()) {
      return typeFilteredPrograms;
    }
    const query = searchQuery.toLowerCase();
    return typeFilteredPrograms.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.programGroup?.name && p.programGroup.name.toLowerCase().includes(query))
    );
  }, [typeFilteredPrograms, searchQuery]);

  // Group programs by program group
  const groupedPrograms = useMemo(() => {
    const groups = new Map<
      string,
      { group: { number: number; name: string } | null; programs: Program[] }
    >();

    filteredPrograms.forEach((program) => {
      const groupKey = program.programGroup
        ? `group-${program.programGroup.number}`
        : "ungrouped";
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          group: program.programGroup
            ? {
                number: program.programGroup.number,
                name: program.programGroup.name,
              }
            : null,
          programs: [],
        });
      }
      
      groups.get(groupKey)!.programs.push(program);
    });

    // Sort groups by number, ungrouped last
    return Array.from(groups.values()).sort((a, b) => {
      if (!a.group) return 1;
      if (!b.group) return -1;
      return a.group.number - b.group.number;
    });
  }, [filteredPrograms]);

  const toggleProgram = (programId: number) => {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) {
        next.delete(programId);
      } else {
        next.add(programId);
      }
      return next;
    });
  };

  const baseUrl = getStrapiURL();

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search programs by title, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Filter Buttons */}
      {showFilters && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => handleFilterChange("all")}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              filter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All Programs
          </button>
          <button
            onClick={() => handleFilterChange("undergraduate")}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              filter === "undergraduate"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Undergraduate
          </button>
          <button
            onClick={() => handleFilterChange("graduate")}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              filter === "graduate"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Graduate
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-center text-sm text-muted-foreground">
        {filteredPrograms.length} {filteredPrograms.length === 1 ? "program" : "programs"} found
        {activeFilter !== "all" && ` in ${activeFilter} programs`}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Programs List - Grouped by Program Group */}
      {filteredPrograms.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No programs found {searchQuery ? `matching "${searchQuery}"` : "for the selected filter"}.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedPrograms.map((groupData) => (
            <div key={groupData.group ? `group-${groupData.group.number}` : "ungrouped"}>
              {/* Group Header */}
              {groupData.group && (
                <div className="mb-4 pb-2 border-b border-border/50">
                  <h2 className="text-lg font-semibold text-foreground">
                    {groupData.group.number}: {groupData.group.name}
                  </h2>
                </div>
              )}

              {/* Programs in this group */}
              <div className="space-y-4">
                {groupData.programs.map((program) => {
            const imageUrl =
              program.image && baseUrl
                ? resolveImageUrl(program.image, baseUrl)
                : null;
            const isExpanded = expandedPrograms.has(program.id);

            return (
              <div
                key={program.id}
                className="overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md"
              >
                {/* Collapsed Header - Always Visible */}
                <button
                  onClick={() => toggleProgram(program.id)}
                  className="w-full text-left"
                >
                  <div className="grid gap-4 p-6 md:grid-cols-[120px,1fr,auto] md:gap-6">
                    {/* Program Image - Thumbnail */}
                    {imageUrl ? (
                      <div className="relative h-24 w-full overflow-hidden rounded-lg bg-muted md:h-28">
                        <Image
                          src={imageUrl}
                          alt={program.image?.alternativeText || program.title}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      </div>
                    ) : (
                      <div className="h-24 w-full rounded-lg bg-linear-to-br from-primary/10 to-primary/5 md:h-28" />
                    )}

                     {/* Program Summary */}
                     <div className="space-y-2 min-w-0">
                       <div className="flex items-center gap-2 flex-wrap">
                         <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                           {program.type === "undergraduate" ? "Undergraduate" : "Graduate"}
                         </span>
                         <div className="flex items-center gap-3 text-xs text-muted-foreground">
                           <span>{program.duration} {program.duration === 1 ? "year" : "years"}</span>
                           <span>•</span>
                           <span>{program.modeOfDelivery}</span>
                         </div>
                       </div>
                       <h3 className="text-lg font-semibold text-foreground md:text-xl">
                         {program.title}
                       </h3>
                      {!isExpanded && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {program.description}
                        </p>
                      )}
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div className="flex items-start justify-end">
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border/50 px-6 pb-6 pt-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {program.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
                );
              })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

