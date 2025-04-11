"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, GraduationCap, User, LogOut, School, Car } from "lucide-react"
import type { customUser } from "@/auth"
import { handleSignOut } from "@/lib/actions/loginActions"
import { SCHOOL_NAME } from "@/env"

interface SidebarProps {
  user: customUser
}

export function SidebarNav({ user }: SidebarProps) {
  const pathname = usePathname()

  const isAdmin = user.isAdmin
  const isTeacher = user.isTeacher

  const routes = [
    {
      href: "/dashboard",
      icon: BarChart3,
      title: "Dashboard",
      visible: true,
    },
    {
      href: "/dashboard/students",
      icon: GraduationCap,
      title: "Students",
      visible: isAdmin || isTeacher,
    },
    {
      href: "/dashboard/employees",
      icon: Users,
      title: "Employees",
      visible: isAdmin,
    },
    {
      href: "/dashboard/class",
      icon: School,
      title: "Classes",
      visible: isAdmin || isTeacher,
    },
    {
      href: "/dashboard/vehicles",
      icon: Car,
      title: "Vehicles",
      visible: isAdmin,
    },
    {
      href: "/dashboard/profile",
      icon: User,
      title: "My Profile",
      visible: true,
    },
  ]

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-14 items-center px-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <School className="h-6 w-6" />
              <span>{SCHOOL_NAME}</span>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {routes
              .filter((route) => route.visible)
              .map((route) => (
                <SidebarMenuItem key={route.href}>
                  <SidebarMenuButton asChild isActive={pathname === route.href}>
                    <Link href={route.href}>
                      <route.icon className="h-4 w-4" />
                      <span>{route.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <form action={handleSignOut} className="p-4">
            <Button variant="outline" className="w-full justify-start" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
