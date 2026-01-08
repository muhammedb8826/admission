"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Search, Clock, BookOpen, Layers } from "lucide-react";
import { getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import { Program, ProgramsFilter } from "../types/programs.types";

type ProgramsListProps = {
  programs: Program[];
  initialFilter?: ProgramsFilter;
  showFilters?: boolean;
};

// Internal component to handle search params safely
function ProgramsContent({ programs, initialFilter = "all", showFilters = true }: ProgramsListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());

  // Priority: URL Param > initialFilter prop
  const activeFilter = (showFilters ? searchParams.get("type") : null) || initialFilter;

  const handleFilterChange = (newFilter: ProgramsFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter === "all") params.delete("type");
    else params.set("type", newFilter);
    router.push(`/programs?${params.toString()}`, { scroll: false });
  };

  const filteredPrograms = useMemo(() => {
    if (!Array.isArray(programs)) return [];

    return programs.filter((p) => {
      const apiLevel = p.level?.toLowerCase() || "";
      const searchStr = searchQuery.toLowerCase();

      // Case-insensitive match between filter and API level
      const matchesFilter = activeFilter === "all" || apiLevel === activeFilter.toLowerCase();
      
      const matchesSearch =
        !searchQuery.trim() ||
        p.name?.toLowerCase().includes(searchStr) ||
        p.description?.toLowerCase().includes(searchStr) ||
        p.department?.name?.toLowerCase().includes(searchStr);

      return matchesFilter && matchesSearch;
    });
  }, [programs, activeFilter, searchQuery]);

  const groupedPrograms = useMemo(() => {
    const groups = new Map<string, { dept: string; items: Program[] }>();

    filteredPrograms.forEach((p) => {
      const key = p.department?.name || "General Programs";
      if (!groups.has(key)) {
        groups.set(key, { dept: key, items: [] });
      }
      groups.get(key)!.items.push(p);
    });

    return Array.from(groups.values());
  }, [filteredPrograms]);

  const toggleProgram = (id: number) => {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const baseUrl = getStrapiURL();

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search within these programs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Filter Tabs (Only shown on the main 'All' page) */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 justify-center">
          {["all", "undergraduate", "postgraduate", "phd", "pgdt", "remedial"].map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f as ProgramsFilter)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition ${
                activeFilter === f ? "bg-primary text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f === "postgraduate" ? "Graduate" : f}
            </button>
          ))}
        </div>
      )}

       {/* Results Count */}
       <div className="text-center text-sm text-muted-foreground">
        {filteredPrograms.length} {filteredPrograms.length === 1 ? "program" : "programs"} found
        {activeFilter !== "all" && ` in ${activeFilter} programs`}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Grouped Programs List */}
      {groupedPrograms.length === 0 ? (
         <div className="rounded-xl border bg-card p-12 text-center">
         <p className="text-muted-foreground">
           No programs found {searchQuery ? `matching "${searchQuery}"` : "for the selected filter"}.
         </p>
       </div>
      ) : (
        <div className="space-y-10">
          {groupedPrograms.map((group) => (
            <div key={group.dept} className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2 text-foreground">
                <Layers className="h-5 w-5 text-primary" />
                {group.dept}
              </h2>

              <div className="space-y-4">
                {group.items.map((program) => {
                  const imageUrl = program.image ? resolveImageUrl(program.image, baseUrl) : null;
                  const isExpanded = expandedPrograms.has(program.id);

                  return (
                    <div key={program.id}  className="overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
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
                          alt={program.image?.alternativeText || program.name}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      </div>
                    ) : (
                      <div className="h-24 w-full rounded-lg bg-linear-to-br from-primary/10 to-primary/5 md:h-28" />
                    )}

                        {/* Program Details */}
                        <div className="space-y-2 min-w-0">
                       <div className="flex items-center gap-2 flex-wrap">
                         <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                            {program.level}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock size={14}/> {program.duration} Years</span>
                            <span className="flex items-center gap-1"><BookOpen size={14}/> {program.mode}</span>
                          </div>
                        </div>
                        {/* Program Name */}
                        <h3 className="text-lg font-semibold text-foreground md:text-xl">{program.name}</h3>

                      
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

                      {isExpanded && (
                        <div className="p-5 pt-0 border-t bg-muted/5">
                          <div className="mt-4 grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Program Overview</h4>
                              <p className="text-sm leading-relaxed">{program.description}</p>
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Quick Stats</h4>
                              <p className="text-sm"><strong>Qualification:</strong> {program.qualification}</p>
                              <p className="text-sm"><strong>Credit Hours:</strong> {program.totalCreditHours}</p>
                            </div>
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


export function ProgramsList(props: ProgramsListProps) {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading programs...</div>}>
      <ProgramsContent {...props} />
    </Suspense>
  );
}