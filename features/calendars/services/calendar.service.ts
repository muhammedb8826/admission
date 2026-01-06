import { strapiFetch } from "@/lib/strapi/client";
import { StrapiCollectionResponse } from "@/lib/strapi/types";
import type { CalendarListItem, SemesterItem } from "../types/calendar.types";


// Fetch calendar list from Strapi
export async function fetchCalendarList(): Promise<CalendarListItem[]> {
  try {
    const response = await strapiFetch<StrapiCollectionResponse<CalendarListItem>>("academic-calendars", {
        params: {
          sort: ["startDate:asc"],
          populate: {
            semesters: true,
            batch: {
              populate: ["program"],
            },
          },
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response?.data?.length) return [];

    console.log(response.data);
    

     return response.data.map((item) => ({
      id: String(item.id),
      documentId: item.documentId ?? "",
      slug: item.slug ?? "",
      name: item.name ?? "",
      academicYearRange: item.academicYearRange ?? "",
      isActive: item.isActive ?? false,

      // calendar dates
      startDate: item.startDate ?? "",
      endDate: item.endDate ?? "",

      // batch info
      batch: item.batch
        ? {
            id: String(item.batch.id),
            name: item.batch.name,
            code: item.batch.code,
            intakeYear: item.batch.intakeYear,
            startYear: item.batch.startYear,
            endYear: item.batch.endYear,
          }
        : null,

      // program info (through batch)
      program: item.batch?.program
        ? {
            id: String(item.batch.program.id),
            name: item.batch.program.name,
            fullName: item.batch.program.fullName,
            duration: item.batch.program.duration,
            level: item.batch.program.level,
            mode: item.batch.program.mode,
          }
        : null,

      // semesters
      semesters: item.semesters?.map((sem: SemesterItem) => ({
        id: String(sem.id),
        name: sem.name,
        semesterNumber: sem.semesterNumber,
        yearNumber: sem.yearNumber,
        startDate: sem.startDate,
        endDate: sem.endDate,
        examStart: sem.examStart,
        examEnd: sem.examEnd,
      })) ?? [],

      createdAt: item.createdAt ?? "",
      updatedAt: item.updatedAt ?? "",
      publishedAt: item.publishedAt ?? "",
    }));
  } catch (error) {
    console.warn("Failed to fetch calendar list:", error);
    return [];
  }
}


export async function fetchCalendarDetail(slug: string): Promise<CalendarListItem | null> {
  console.log("fetchCalendarDetail", slug);
  const response = await strapiFetch<StrapiCollectionResponse<CalendarListItem>>("academic-calendars", {
    params: {
      populate: { semesters: true, batch: { populate: ["program"] } },
      filters: { slug: { $in: [slug, `/${slug}`] } },
    },
    next: { revalidate: 60 },
  });

  const calendar = response.data?.[0];
  if (!calendar) return null;

  return {
    id: String(calendar.id),
    documentId: calendar.documentId ?? "",
    slug: calendar.slug ?? "",
    name: calendar.name ?? "",
    academicYearRange: calendar.academicYearRange ?? "",
    isActive: calendar.isActive ?? false,

    startDate: calendar.startDate ?? "",
    endDate: calendar.endDate ?? "",

    createdAt: calendar.createdAt ?? "",
    updatedAt: calendar.updatedAt ?? "",
    publishedAt: calendar.publishedAt ?? "",

    program: calendar.program
      ? {
          id: String(calendar.program.id),
          name: calendar.program.name,
          fullName: calendar.program.fullName,
          duration: calendar.program.duration,
          level: calendar.program.level,
          mode: calendar.program.mode,
          }
      : null,

    batch: calendar.batch
      ? {
          id: String(calendar.batch.id),
          name: calendar.batch.name,
          code: calendar.batch.code,
          intakeYear: calendar.batch.intakeYear,
          startYear: calendar.batch.startYear,
          endYear: calendar.batch.endYear,
          program: calendar.batch.program
            ? {
                id: String(calendar.batch.program.id),
                name: calendar.batch.program.name,
                fullName: calendar.batch.program.fullName,
                duration: calendar.batch.program.duration,
                level: calendar.batch.program.level,
                mode: calendar.batch.program.mode,
              }
            : null,
        }
      : null,

    semesters: calendar.semesters?.map((sem: SemesterItem) => ({
      id: String(sem.id),
      name: sem.name ?? "",
      semesterNumber: sem.semesterNumber ?? 0,
      yearNumber: sem.yearNumber ?? 0,
      startDate: sem.startDate ?? "",
      endDate: sem.endDate ?? "",
      examStart: sem.examStart ?? "",
      examEnd: sem.examEnd ?? "",
    })) ?? [],
  };
}