import type React from "react";
import { redirect } from "next/navigation";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function getInitials(firstName: string, email: string): string {
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

// Simple calendar component
function SimpleCalendar() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          {monthNames[currentMonth]} {currentYear}
        </h2>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const isToday = day === today.getDate();
          const isPast = day !== null && day < today.getDate();
          
          return (
            <div
              key={index}
              className={`
                aspect-square p-2 rounded-md border text-center
                ${day === null ? "bg-transparent border-transparent" : "border-border hover:bg-muted/50"}
                ${isToday ? "bg-primary/10 border-primary font-semibold" : ""}
                ${isPast ? "text-muted-foreground" : "text-foreground"}
              `}
            >
              {day !== null && (
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{day}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function CalendarPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = {
    name: session.firstName || "User",
    email: session.email,
    avatar: "",
    initials: getInitials(session.firstName, session.email),
  };

  // Sample important dates - will be replaced with real data later
  const importantDates = [
    {
      title: "Application Deadline",
      date: "2025-01-15",
      type: "deadline",
      description: "Last day to submit admission applications",
    },
    {
      title: "Document Submission Deadline",
      date: "2025-01-20",
      type: "deadline",
      description: "Submit all required documents",
    },
    {
      title: "Entrance Exam",
      date: "2025-02-10",
      type: "event",
      description: "Admission entrance examination",
    },
    {
      title: "Results Announcement",
      date: "2025-02-28",
      type: "announcement",
      description: "Admission results will be published",
    },
  ];

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader title="Calendar" />
        <div className="flex min-h-screen flex-col bg-muted/20">
          {/* Page header */}
          <header className="border-b bg-background px-6 py-4">
            <h1 className="text-xl font-semibold text-foreground">
              Academic Calendar
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Important dates and deadlines for admission
            </p>
          </header>

          {/* Main content */}
          <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Calendar */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Calendar</CardTitle>
                    <CardDescription>View important dates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SimpleCalendar />
                  </CardContent>
                </Card>
              </div>

              {/* Important Dates */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Important Dates</CardTitle>
                    <CardDescription>Upcoming deadlines and events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {importantDates.map((date, index) => {
                        const dateObj = new Date(date.date);
                        const isPast = dateObj < new Date();
                        
                        return (
                          <div
                            key={index}
                            className={`p-4 rounded-md border ${
                              isPast
                                ? "bg-muted/50 border-muted"
                                : "bg-background border-border"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold">
                                  {date.title}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {date.description}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  date.type === "deadline"
                                    ? "destructive"
                                    : date.type === "event"
                                    ? "default"
                                    : "secondary"
                                }
                                className="shrink-0"
                              >
                                {date.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <CalendarIcon className="h-3 w-3" />
                              <span>
                                {dateObj.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Calendar Information</CardTitle>
                <CardDescription>Stay updated with important dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-red-500/10 p-2">
                      <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Deadlines</p>
                      <p className="text-xs text-muted-foreground">
                        Important submission deadlines
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Events</p>
                      <p className="text-xs text-muted-foreground">
                        Upcoming admission events
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-500/10 p-2">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Announcements</p>
                      <p className="text-xs text-muted-foreground">
                        Important announcements
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

