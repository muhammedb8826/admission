import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CalendarsList } from "@/features/calendars/components/CalendarsList";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

function getInitials(firstName: string, email: string): string {
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mx-auto max-w-6xl">
                <CalendarsList />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
