import type React from "react"
import Image from "next/image"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { getSession } from "@/lib/auth/session"

function getInitials(firstName: string, email: string): string {
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase()
  }
  return email.substring(0, 2).toUpperCase()
}

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const user = {
    name: session.firstName || "User",
    email: session.email,
    avatar: "",
    initials: getInitials(session.firstName, session.email),
  }

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
        <div className="flex min-h-screen flex-col bg-muted/20">
          {/* Profile header */}
          <header className="flex items-center gap-4 border-b bg-background px-6 py-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-semibold text-primary/80">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{user.initials}</span>
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-foreground">
                {user.name}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </header>

          {/* Main content */}
          <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
            {/* Left vertical menu */}
            {/* <aside className="w-full max-w-xs">
              <div className="rounded-md border bg-background shadow-sm">
                <nav className="flex flex-col text-sm">
                  {[
                    "Basic Profile",
                    "Profile Picture",
                    "Location & Contact Details",
                    "Education Details",
                    "Work / Professional Details",
                    "Achievements",
                    "Additional Details",
                  ].map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      className={`flex items-center justify-between border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/60 ${
                        index === 0
                          ? "bg-muted font-medium text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span>{label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside> */}

            {/* Right profile form */}
            
            <section className="flex-1">
              <div className="space-y-6 rounded-md border bg-background p-6 shadow-sm">
                {/* <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Basic profile
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please update profile details here
                  </p>
                </div> */}

                {/* <form className="space-y-8"> */}
                  {/* Name row */}
                  {/* <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1 md:col-span-1">
                      <label className="block text-sm font-medium text-foreground">
                        Name
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        defaultValue={user.name}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-foreground">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-foreground">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div> */}

                  {/* About me */}
                  {/* <div className="space-y-1">
                    <label className="block text-sm font-medium text-foreground">
                      About Me
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      Max of 1000 characters
                    </p>
                  </div> */}

                  {/* <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Update Profile
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:text-primary/80"
                    >
                      Cancel and View Profile
                    </button>
                  </div> */}
                {/* </form> */}
              </div>
            </section>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


