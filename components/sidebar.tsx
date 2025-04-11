"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, GraduationCap, User, LogOut, School, Car, Settings, Sun, Moon, Laptop } from "lucide-react"
import type { customUser } from "@/auth"
import { handleSignOut } from "@/lib/actions/loginActions"
import { SCHOOL_NAME, BACKEND_SERVER_URL } from "@/env"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SidebarProps {
  user: customUser
}

export function SidebarNav({ user }: SidebarProps) {
  const pathname = usePathname()
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure theme component only renders after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

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
      href: "/dashboard/employees/attendance-report",
      icon: Users,
      title: "Attendance Report",
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

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const profileImageUrl = `${BACKEND_SERVER_URL}/v1/employee/${user.id}/profileImg`

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader>
          <div className="flex h-14 items-center px-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <School className="h-6 w-6" />
              <span>{SCHOOL_NAME}</span>
            </Link>
            <div className="ml-auto">
              <SidebarTrigger />
            </div>
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
        <SidebarFooter className="border-t p-4">
          <div className="flex flex-col gap-4">
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Theme
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Laptop className="mr-2 h-4 w-4" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profileImageUrl} alt={user.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{user.name}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>
            <form action={handleSignOut}>
              <Button variant="outline" className="w-full justify-start" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </form>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
