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

export default async function FAQsPage() {
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
        <SiteHeader title="FAQs" />
        <div className="flex flex-1 flex-col">
          <PageHeaderBanner
            title="FAQ's"
            backgroundImageUrl="/images/hero-banner/banner.jpg"
            crumbs={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "FAQ's" },
            ]}
          />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="mx-auto max-w-4xl space-y-6">
                    <p className="text-base text-muted-foreground">
                      Frequently asked questions for alumni of Dembi Dollo University.
                    </p>

                    <div className="space-y-4">
                      {/* Q1 */}
                      <div className="rounded-lg border bg-background p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground">
                          1. How do I register for the Dembi Dollo University Alumni Network?
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          You can register by going to the alumni registration page on the website
                          and completing the online form with your personal details, graduation
                          information, and contact address. Once submitted, our team will review
                          your application and notify you by email when your membership is
                          approved.
                        </p>
                      </div>

                      {/* Q2 */}
                      <div className="rounded-lg border bg-background p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground">
                          2. I forgot my password. How can I reset it?
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Click on the &quot;Reset Password&quot; link on the login page and enter
                          the email address you used for registration. You will receive an email
                          with a secure link that lets you choose a new password. If you don&apos;t
                          receive the email within a few minutes, please check your spam folder or
                          contact support.
                        </p>
                      </div>

                      {/* Q3 */}
                      <div className="rounded-lg border bg-background p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground">
                          3. How can I update my profile information (job, address, phone, etc.)?
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          After logging in, go to your dashboard and open the &quot;Basic
                          Profile&quot; section. From there you can update your personal details,
                          contact information, and professional details. Don&apos;t forget to click
                          &quot;Update Profile&quot; at the bottom to save your changes.
                        </p>
                      </div>

                      {/* Q4 */}
                      <div className="rounded-lg border bg-background p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground">
                          4. How do I request an official transcript or alumni letter?
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          From the dashboard sidebar, open &quot;Alumni Services&quot; and choose
                          &quot;Official Transcript Request&quot;. Fill in the required details
                          (graduation year, program, delivery address, etc.) and submit the
                          request. You can track the status of your request from
                          &quot;Official Transcript Request Status&quot;.
                        </p>
                      </div>

                      {/* Q5 */}
                      <div className="rounded-lg border bg-background p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground">
                          5. How can I stay informed about events and news for alumni?
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          All upcoming events are listed on the &quot;Events&quot; page, and news
                          and stories are posted under &quot;News &amp; Blogs&quot; on the website.
                          When you are logged in, you can also access these sections from your
                          dashboard. Important announcements may also be sent to your registered
                          email address.
                        </p>
                      </div>

                      {/* Q6 */}
                      <div className="rounded-lg border bg-background p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground">
                          6. How can I support Dembi Dollo University as an alumnus?
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          You can support the university in many ways: sharing your success story,
                          mentoring current students, speaking at events, or contributing to
                          development projects and scholarships. Use the &quot;Support&quot; or
                          &quot;Donate&quot; sections on the website, or contact the alumni
                          relations office for more information.
                        </p>
                      </div>

                      {/* Q7 */}
                      <div className="rounded-lg border bg-background p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground">
                          7. Who do I contact if I have questions or technical issues?
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          For technical issues with the alumni portal, please use the contact
                          details provided on the &quot;Contact&quot; section of the main site or
                          send an email to the alumni office. Include your full name, graduation
                          year, and a brief description of the problem so that we can assist you
                          quickly.
                        </p>
                      </div>
                    </div>
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

