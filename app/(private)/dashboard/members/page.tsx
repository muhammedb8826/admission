import type React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageHeaderBanner } from "@/features/layout";
import { fetchAlumniList } from "@/features/alumni/services/alumni.service";
import { DataTable } from "@/components/data-table";

function getInitials(firstName: string, email: string): string {
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export default async function MembersPage() {
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

  const members = await fetchAlumniList();

  const tableData = members.map((member, index) => ({
    id: index + 1,
    header: member.fullName || "Member",
    type: member.jobTitle ? "Employed" : "Member",
    status: member.jobTitle ? "Active" : "Member",
    target: member.jobTitle || "Role not provided",
    limit: member.location || "Location not provided",
    reviewer: member.slug || "Profile",
  }));

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
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <PageHeaderBanner
            title="Members"
            backgroundImageUrl="/images/hero-banner/banner.jpg"
            crumbs={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Members" },
            ]}
          />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="mx-auto max-w-6xl">
                    <DataTable data={tableData} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

