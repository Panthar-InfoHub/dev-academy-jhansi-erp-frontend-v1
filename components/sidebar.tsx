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
  Clock,
  Calendar,
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
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Students: true, // Open by default
    Employees: true, // Open by default
    Payments: true,
    Admin: true,
  })

  // Add localStorage to remember sidebar state
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== "undefined") {
      // Try to get the saved state from localStorage
      const savedState = localStorage.getItem("sidebarCollapsed")
      if (savedState !== null) {
        setIsCollapsed(savedState === "true")
      }
    }
  }, [])

  // Handle scroll to hide/show mobile menu
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        const currentScrollY = window.scrollY

        if (currentScrollY > lastScrollY && currentScrollY > 20) {
          // Scrolling down - hide the menu
          setShowMobileMenu(false)
        } else {
          // Scrolling up - show the menu
          setShowMobileMenu(true)
        }

        setLastScrollY(currentScrollY)
      }
    }

    window.addEventListener("scroll", controlNavbar)

    // Cleanup
    return () => {
      window.removeEventListener("scroll", controlNavbar)
    }
  }, [lastScrollY])

  // Update the setIsCollapsed function to save state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", String(newState))
    }
  }

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
      visible: true, // Make visible to all users, but content will be controlled elsewhere
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
      visible: true, // Make visible to all users
      children: [
        {
          href: "/dashboard/employees",
          icon: ClipboardList,
          title: "Employee Management",
          visible: isAdmin,
          adminOnly: true,
        },
        {
          href: "/dashboard/employees/attendance-report",
          icon: Calendar, // Changed from ClipboardList to Calendar
          title: "Attendance Report",
          visible: isAdmin,
          adminOnly: true,
        },
        {
          href: "/dashboard/employee/check-in", // Add check-in link
          icon: Clock,
          title: "Check In",
          visible: true, // Visible to all employees
        },
      ],
    },
    {
      href: "/dashboard/class",
      icon: School,
      title: "Class Management",
      visible: isAdmin || isTeacher,
    },
    {
      href: "/dashboard/vehicles",
      icon: Car,
      title: "Vehicles",
      visible: isAdmin,
      adminOnly: true,
    },
    {
      href: "/dashboard/payments",
      icon: DollarSign,
      title: "Payments",
      visible: isAdmin,
      adminOnly: true,
      children: [
        {
          href: "/dashboard/payments",
          icon: Receipt,
          title: "Manage Payments",
          visible: isAdmin,
          adminOnly: true,
        },
      ],
    },
    {
      href: "/dashboard/admin/manage",
      icon: Settings,
      title: "Admin",
      visible: isAdmin,
      adminOnly: true,
      children: [
        {
          href: "/dashboard/admin/manage",
          icon: Users,
          title: "Manage",
          visible: isAdmin,
          adminOnly: true,
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

  // Helper function to check if a route or any of its children are active
  const isRouteActive = (item: NavItem): boolean => {
    // Check if the current path exactly matches this route
    if (pathname === item.href) {
      return true
    }

    // Special case for employees section - only for collapsed sidebar
    if (
      isCollapsed &&
      item.title === "Employees" &&
      (pathname.startsWith("/dashboard/employees/") || pathname.startsWith("/dashboard/employee/"))
    ) {
      return true
    }

    // Check if any child routes are active - only for collapsed sidebar
    if (isCollapsed && item.children) {
      return item.children.some(
        (child) => pathname === child.href || (child.href !== "/dashboard" && pathname.startsWith(child.href)),
      )
    }

    return false
  }

  // Helper function to find active child of a parent route
  const findActiveChild = (item: NavItem): NavItem | null => {
    if (!item.children) return null

    return (
      item.children.find(
        (child) => pathname === child.href || (child.href !== "/dashboard" && pathname.startsWith(child.href)),
      ) || null
    )
  }

  // Helper function to check if a specific path is active
  const isPathActive = (path: string): boolean => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
  }

  const renderNavItem = (item: NavItem, isNested = false, forMobile = false) => {
    // Skip items that should not be visible to this user
    if (!item.visible || (item.adminOnly && !isAdmin)) {
      return null
    }

    // Different active state logic based on sidebar state
    const hasActiveChild = item.children?.some(
      (child) => pathname === child.href || (child.href !== "/dashboard" && pathname.startsWith(child.href)),
    )

    // For expanded sidebar: main entry is active only if exact match
    // For collapsed sidebar: main entry is active if it or any child is active
    const isActive = isCollapsed && !forMobile ? isRouteActive(item) : pathname === item.href

    console.log(
      `Checking route: ${item.title}, href: ${item.href}, pathname: ${pathname}, isActive: ${isActive}, hasActiveChild: ${hasActiveChild}`,
    )

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
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent text-accent-foreground" : "transparent",
              isCollapsed && !forMobile && "justify-center px-0",
              isNested && "pl-6", // Reduced padding for nested items
            )}
            onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
          >
            <item.icon className={cn("h-4 w-4", isActive && "h-[18px] w-[18px]")} />
            {(!isCollapsed || forMobile) && <span>{item.title}</span>}
          </Link>
        )
      }

      // For expanded sidebar
      if (!isCollapsed || forMobile) {
        return (
          <div key={item.title} className="space-y-0.5 py-0.5">
            <Collapsible open={openGroups[item.title] || hasActiveChild} onOpenChange={() => toggleGroup(item.title)}>
              <div className="flex items-center">
                <Link
                  href={item.children[0].href}
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "transparent",
                  )}
                  onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
                >
                  <item.icon className={cn("h-4 w-4", isActive && "h-[18px] w-[18px]")} />
                  <span>{item.title}</span>
                </Link>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 w-7 p-0",
                      (isActive || hasActiveChild) && "hidden", // Hide when active or has active child
                    )}
                  >
                    {openGroups[item.title] ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="mt-0.5 space-y-0.5">
                {item.children.map((child) => renderNavItem(child, true, forMobile))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )
      }

      // For collapsed sidebar - show parent and all children when parent is active
      const activeChild = findActiveChild(item)
      const isParentActive = isRouteActive(item)

      return (
        <div key={item.title} className="space-y-0.5 py-0.5">
          {/* Main parent icon */}
          <Link
            href={item.children[0].href}
            className={cn(
              "flex justify-center rounded-md px-0 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isParentActive ? "bg-accent text-accent-foreground" : "transparent",
            )}
            onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
          >
            <item.icon className={cn("h-4 w-4", isParentActive && "h-[18px] w-[18px] text-accent-foreground")} />
          </Link>

          {/* Show all child icons when parent is active */}
          {isParentActive && (
            <div className="space-y-0.5 mt-0.5">
              {item.children
                .filter((child) => child.visible && (!child.adminOnly || (child.adminOnly && isAdmin)))
                .map((child, index) => {
                  const isChildActive = isPathActive(child.href)
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex justify-center rounded-md px-0 py-1.5 text-sm font-medium",
                        isChildActive
                          ? "bg-accent/80 text-accent-foreground"
                          : "bg-muted/40 hover:bg-accent/50 hover:text-accent-foreground",
                      )}
                    >
                      <child.icon
                        className={cn(
                          "h-4 w-4",
                          isChildActive ? "h-[18px] w-[18px] text-accent-foreground" : "text-muted-foreground",
                        )}
                      />
                    </Link>
                  )
                })}
            </div>
          )}
        </div>
      )
    }

    // Regular nav item
    if (isNested) {
      const isItemActive = isPathActive(item.href)
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isItemActive ? "bg-accent text-accent-foreground" : "transparent",
            isCollapsed && !forMobile && "justify-center px-0",
            isCollapsed && !forMobile ? "bg-muted/40" : "pl-6", // Use background color instead of border
          )}
          onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
        >
          <item.icon className={cn("h-4 w-4", isItemActive && "h-[18px] w-[18px] text-accent-foreground")} />
          {(!isCollapsed || forMobile) && <span>{item.title}</span>}
        </Link>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          isActive ? "bg-accent text-accent-foreground" : "transparent",
          isCollapsed && !forMobile && "justify-center px-0",
        )}
        onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
      >
        <item.icon className={cn("h-4 w-4", isActive && "h-[18px] w-[18px] text-accent-foreground")} />
        {(!isCollapsed || forMobile) && <span>{item.title}</span>}
      </Link>
    )
  }

  // Desktop sidebar - fixed position to prevent scrolling
  const DesktopSidebar = (
    <div
      className={cn(
        "hidden md:flex flex-col h-screen border-r bg-background transition-all duration-300 fixed top-0 left-0",
        isCollapsed ? "w-[60px]" : "w-[220px]", // Reduced width
      )}
    >
      <div className="flex h-12 items-center px-3 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          {!isCollapsed && <span className="text-sm">{SCHOOL_NAME}</span>} {/* Smaller text */}
        </Link>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm" // Smaller button
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="h-7 w-7 p-0" // Smaller button
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-0.5 px-1.5">
          {routes.map((route) => {
            return renderNavItem(route)
          })}
        </nav>
      </div>

      <div className="border-t p-3">
        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("w-full h-7", isCollapsed ? "justify-center px-0" : "justify-start")} // Smaller height
              >
                <Settings className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2 text-xs">Theme</span>} {/* Smaller text */}
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
        <div
          onClick={() => router.push("/dashboard/profile")}
          className={cn("flex items-center gap-2 mt-3 cursor-pointer", isCollapsed && "justify-center")}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={profileImageUrl || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-medium truncate text-xs">{user.name}</span> {/* Smaller text */}
              <span className="text-xs text-muted-foreground truncate">{user.email}</span> {/* Smaller text */}
            </div>
          )}
        </div>
        <form action={handleSignOut} className="mt-3">
          <Button
            variant="outline"
            size="sm"
            className={cn("w-full h-7", isCollapsed ? "justify-center px-0" : "justify-start")} // Smaller height
            type="submit"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2 text-xs">Log out</span>} {/* Smaller text */}
          </Button>
        </form>
      </div>
    </div>
  )

  // Mobile sidebar (using Sheet component)
  const MobileSidebar = (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "md:hidden fixed top-2 left-2 z-50 transition-opacity duration-300",
            showMobileMenu ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[250px]">
        <div className="flex flex-col h-full">
          <div className="flex h-14 items-center px-4 border-b">
            <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
              <span>{SCHOOL_NAME}</span>
            </Link>
          </div>

          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-2">
              {routes.map((route) => {
                // For mobile, always render with forMobile=true to show nested items
                return renderNavItem(route, false, true)
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
                <AvatarImage src={profileImageUrl || "/placeholder.svg"} alt={user.name} />
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
      <div className={cn("md:pl-[220px] pt-14 md:pt-0", isCollapsed && "md:pl-[60px]")}></div>
    </>
  )
}
