import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageHeaderBanner } from "@/features/layout";

function getInitials(firstName: string, email: string): string {
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export default async function AboutAlumniPage() {
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
        <SiteHeader title="About Alumni" />
        <div className="flex flex-1 flex-col">
          <PageHeaderBanner
            title="About Alumni"
            backgroundImageUrl="/images/hero-banner/banner.jpg"
            crumbs={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "About Alumni" },
            ]}
          />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="mx-auto max-w-4xl space-y-6">
                    <section className="space-y-4">
                      <h2 className="text-2xl font-bold tracking-tight">
                        Welcome to the Alumni Network
                      </h2>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        Welcome to the Dembi Dolo University Alumni Association. We are a vibrant community
                        of graduates committed to maintaining lifelong connections with our alma mater
                        and supporting each other&apos;s professional and personal growth.
                      </p>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xl font-semibold tracking-tight">
                        Our Mission
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        Our mission is to foster a strong network of alumni who continue to contribute
                        to the university&apos;s excellence and support the next generation of graduates.
                        We aim to create opportunities for mentorship, networking, and professional
                        development while giving back to the institution that shaped us.
                      </p>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xl font-semibold tracking-tight">
                        What We Offer
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                        <li>Professional networking opportunities</li>
                        <li>Mentorship programs for current students</li>
                        <li>Career development resources</li>
                        <li>Regular events and reunions</li>
                        <li>Volunteer opportunities to support the university</li>
                        <li>Access to exclusive alumni benefits and resources</li>
                      </ul>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xl font-semibold tracking-tight">
                        Stay Connected
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        Join our growing community of alumni and stay connected with classmates,
                        faculty, and the university. Update your profile to ensure you receive
                        important updates and invitations to upcoming events.
                      </p>
                    </section>
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

