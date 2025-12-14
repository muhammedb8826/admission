import type React from "react";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth/session";
import { StudentApplicationForm } from "@/components/student-application-form";

function getInitials(firstName: string, email: string): string {
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export default async function ApplicationPage() {
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
        <SiteHeader title="Student Application" />
        <div className="flex min-h-screen flex-col bg-muted/20">
          {/* Page header */}
          <header className="border-b bg-background px-6 py-4">
            <h1 className="text-xl font-semibold text-foreground">
              Student Application
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete your application form to apply for admission
            </p>
          </header>

          {/* Main content */}
          <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
            <section className="flex-1">
              <StudentApplicationForm />
            </section>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

