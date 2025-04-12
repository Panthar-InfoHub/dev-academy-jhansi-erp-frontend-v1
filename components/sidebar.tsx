"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Users,
  GraduationCap,
  User,
  LogOut,
  School,
  Car,
  Settings,
  Sun,
  Moon,
  Laptop,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Search,
  DollarSign,
  Receipt,
} from "lucide-react"
import type { customUser } from "@/auth"
import { handleSignOut } from "@/lib/actions/loginActions"
import { SCHOOL_NAME, BACKEND_SERVER_URL } from "@/env"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SidebarProps {
  user: customUser
}

interface NavItem {
  href: string
  icon: React.ElementType
  title: string
  visible: boolean
  adminOnly?: boolean
  children?: NavItem[]
}

export function SidebarNav({ user }: SidebarProps) {
  const pathname = usePathname()
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Students: true, // Open by default
    Employees: true, // Open by default
    Payments: true,
    Admin: true,
  })

  // Ensure theme component only renders after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const isAdmin = user.isAdmin
  const isTeacher = user.isTeacher
  const router = useRouter()

  const routes: NavItem[] = [
    {
      href: "/dashboard",
      icon: BarChart3,
      title: "Dashboard",
      visible: isAdmin, // Only admins see the dashboard
    },
    {
      href: "/dashboard/students",
      icon: GraduationCap,
      title: "Students",
      visible: isAdmin || isTeacher,
      children: [
        {
          href: "/dashboard/students",
          icon: ClipboardList,
          title: "Student Management",
          visible: isAdmin || isTeacher,
        },
        {
          href: "/dashboard/students/search",
          icon: Search,
          title: "Search",
          visible: isAdmin || isTeacher,
        },
      ],
    },
    {
      href: "/dashboard/employees",
      icon: Users,
      title: "Employees",
      visible: isAdmin,
      adminOnly: true,
      children: [
        {
          href: "/dashboard/employees",
          icon: ClipboardList,
          title: "Employee Management",
          visible: isAdmin,
        },
        {
          href: "/dashboard/employees/attendance-report",
          icon: ClipboardList,
          title: "Attendance Report",
          visible: isAdmin,
        },
      ],
    },
    {
      href: "/dashboard/class",
      icon: School,
      title: "Class Management", // Renamed from "Classes" to "Class Management"
      visible: isAdmin || isTeacher,
    },
    {
      href: "/dashboard/vehicles",
      icon: Car,
      title: "Vehicles",
      visible: isAdmin,
    },
    {
      href: "/dashboard/payments",
      icon: DollarSign,
      title: "Payments",
      visible: isAdmin,
      children: [
        {
          href: "/dashboard/payments",
          icon: Receipt,
          title: "Manage Payments",
          visible: isAdmin,
        },
      ],
    },
    {
      href: "/dashboard/admin/manage",
      icon: Settings,
      title: "Admin",
      visible: isAdmin,
      children: [
        {
          href: "/dashboard/admin/manage",
          icon: Users,
          title: "Manage",
          visible: isAdmin,
        },
      ],
    },
    {
      href: "/dashboard/profile",
      icon: User,
      title: "My Profile",
      visible: true, // Everyone sees their profile
    },
  ]

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const profileImageUrl = `${BACKEND_SERVER_URL}/v1/employee/${user.id}/profileImg`

  const handleNavItemClick = (item: NavItem) => {
    // If the item has children, navigate to the first visible child
    if (item.children && item.children.length > 0) {
      const firstVisibleChild = item.children.find(
        (child) => child.visible && (!child.adminOnly || (child.adminOnly && isAdmin)),
      )

      if (firstVisibleChild) {
        router.push(firstVisibleChild.href)
        if (isMobileMenuOpen) setIsMobileMenuOpen(false)
        return
      }
    }

    // Otherwise, navigate to the item's href
    router.push(item.href)
    if (isMobileMenuOpen) setIsMobileMenuOpen(false)
  }

  const renderNavItem = (item: NavItem, isNested = false) => {
    // Skip items that should not be visible to this user
    if (!item.visible || (item.adminOnly && !isAdmin)) {
      return null
    }

    // If the item has children, render a collapsible
    if (item.children && item.children.length > 0) {
      const hasVisibleChildren = item.children.some(
        (child) => child.visible && (!child.adminOnly || (child.adminOnly && isAdmin)),
      )

      if (!hasVisibleChildren) {
        // If no visible children, render as a normal link
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
              isCollapsed && "justify-center px-0",
              isNested && "pl-8", // Increased left padding for nested items
            )}
            onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
          >
            <item.icon className="h-4 w-4" />
            {!isCollapsed && <span>{item.title}</span>}
          </Link>
        )
      }

      return (
        <div key={item.title} className="space-y-1 py-1">
          <Collapsible
            open={openGroups[item.title]}
            onOpenChange={() => toggleGroup(item.title)}
            className={cn(isCollapsed && "hidden")}
          >
            <div className="flex items-center">
              <Link
                href={item.children[0].href}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
                )}
                onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {openGroups[item.title] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-1 space-y-1">
              {item.children.map((child) => renderNavItem(child, true))}
            </CollapsibleContent>
          </Collapsible>

          {/* When sidebar is collapsed, show only the icon */}
          {isCollapsed && (
            <Link
              href={item.children[0].href}
              className={cn(
                "flex justify-center rounded-md px-0 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
              )}
              onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
            >
              <item.icon className="h-4 w-4" />
            </Link>
          )}
        </div>
      )
    }

    // Regular nav item
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
          isCollapsed && "justify-center px-0",
          isNested && "pl-8", // Increased left padding for nested items
        )}
        onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
      >
        <item.icon className="h-4 w-4" />
        {!isCollapsed && <span>{item.title}</span>}
      </Link>
    )
  }

  // Desktop sidebar - fixed position to prevent scrolling
  const DesktopSidebar = (
    <div
      className={cn(
        "hidden md:flex flex-col h-screen border-r bg-background transition-all duration-300 fixed top-0 left-0",
        isCollapsed ? "w-[70px]" : "w-[250px]",
      )}
    >
      <div className="flex h-14 items-center px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
          {/* <School className="h-6 w-6" /> */}
          {!isCollapsed && <span>{SCHOOL_NAME}</span>}
        </Link>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {routes.map((route) => {
            return renderNavItem(route)
          })}
        </nav>
      </div>

      <div className="border-t p-4">
        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("w-full", isCollapsed ? "justify-center px-0" : "justify-start")}
              >
                <Settings className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Theme</span>}
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

        <div className={cn("flex items-center gap-3 mt-4", isCollapsed && "justify-center")}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={profileImageUrl} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-medium truncate">{user.name}</span>
              <span className="text-sm text-muted-foreground truncate">{user.email}</span>
            </div>
          )}
        </div>

        <form action={handleSignOut} className="mt-4">
          <Button
            variant="outline"
            className={cn("w-full", isCollapsed ? "justify-center px-0" : "justify-start")}
            type="submit"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Log out</span>}
          </Button>
        </form>
      </div>
    </div>
  )

  // Mobile sidebar (using Sheet component)
  const MobileSidebar = (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[250px]">
        <div className="flex flex-col h-full">
          <div className="flex h-14 items-center px-4 border-b">
            <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
              {/* <School className="h-6 w-6" /> */}
              <span>{SCHOOL_NAME}</span>
            </Link>
          </div>

          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-2">
              {routes.map((route) => {
                // For mobile, we'll always show the full version (not collapsed)
                const isCollapsedBackup = isCollapsed
                let isCollapsedTemp = false
                const result = renderNavItem(route)
                isCollapsedTemp = isCollapsedBackup
                return result
              })}
            </nav>
          </div>

          <div className="border-t p-4">
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="h-4 w-4" />
                    <span className="ml-2">Theme</span>
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

            <div className="flex items-center gap-3 mt-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profileImageUrl} alt={user.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate">{user.name}</span>
                <span className="text-sm text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>

            <form action={handleSignOut} className="mt-4">
              <Button variant="outline" className="w-full justify-start" type="submit">
                <LogOut className="h-4 w-4" />
                <span className="ml-2">Log out</span>
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  // Add padding to the main content to account for the fixed sidebar
  return (
    <>
      {DesktopSidebar}
      {MobileSidebar}
      <div className={cn("md:pl-[250px]", isCollapsed && "md:pl-[70px]")}></div>
    </>
  )
}
