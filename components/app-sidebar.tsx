"use client"

import * as React from "react"
import {
  IconCalendar,
  IconFileDescription,
  IconInnerShadowTop,
  IconUser,
  IconLayoutDashboard,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

type SidebarUser = {
  name: string
  email: string
  avatar?: string
  initials?: string
}

function getInitials(name: string, email: string): string {
  // Try to get initials from name first
  if (name && name.trim()) {
    const nameParts = name.trim().split(/\s+/)
    if (nameParts.length >= 2) {
      // Use first letter of first name and first letter of last name
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    }
    // Use first two letters of first name if only one word
    return name.substring(0, 2).toUpperCase()
  }
  // Fallback to email initials
  return email.substring(0, 2).toUpperCase()
}

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconLayoutDashboard,
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: IconUser,
    },
    {
      title: "Application",
      url: "/dashboard/application",
      icon: IconFileDescription,
    },
    {
      title: "Calendar",
      url: "/dashboard/calendar",
      icon: IconCalendar,
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: SidebarUser
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const fallbackUser = data.user
  const userData: SidebarUser = {
    name: user?.name || fallbackUser.name,
    email: user?.email || fallbackUser.email,
    avatar: user?.avatar || fallbackUser.avatar,
    initials: user?.initials,
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Admission</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar || "/avatars/shadcn.jpg",
            initials: userData.initials || getInitials(userData.name, userData.email),
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
