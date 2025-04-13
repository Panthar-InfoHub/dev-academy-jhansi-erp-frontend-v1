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
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible"
import { motion, AnimatePresence } from "framer-motion"

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
  const [activeRoute, setActiveRoute] = useState<string | null>(null)
  const [isLargeScreen, setIsLargeScreen] = useState(false)

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
    console.log("Sidebar state initialized from localStorage")
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
    console.log("Scroll event listener added for mobile menu")

    // Cleanup
    return () => {
      window.removeEventListener("scroll", controlNavbar)
      console.log("Scroll event listener removed")
    }
  }, [lastScrollY])

  // Update the setIsCollapsed function to save state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", String(newState))
    }
    console.log(`Sidebar toggled to ${newState ? "collapsed" : "expanded"} state`)
  }

  // Ensure theme component only renders after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    console.log("Component mounted")
  }, [])

  // Check for screen size
  useEffect(() => {
    // Check if window is available (for SSR compatibility)
    if (typeof window !== "undefined") {
      // Define your media query for md breakpoint
      const mediaQuery = window.matchMedia("(min-width: 768px)") // md breakpoint in Tailwind

      // Set initial value
      setIsLargeScreen(mediaQuery.matches)

      // Add listener for changes
      const handleChange = (e: MediaQueryListEvent) => {
        setIsLargeScreen(e.matches)
      }

      mediaQuery.addEventListener("change", handleChange)

      // Clean up
      return () => {
        mediaQuery.removeEventListener("change", handleChange)
      }
    }
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

  // Determine the most specific active route on pathname change
  useEffect(() => {
    console.log("Current pathname:", pathname)

    // Find the most specific matching route
    let bestMatch: { route: string; specificity: number } = { route: "", specificity: 0 }

    // Helper function to check all routes recursively
    const checkRoutes = (items: NavItem[], parentPath = "") => {
      items.forEach((item) => {
        if (!item.visible || (item.adminOnly && !isAdmin)) return

        // Check if this route matches the current path
        if (pathname === item.href) {
          // Exact match has highest specificity
          const specificity = item.href.split("/").length * 1000
          if (specificity > bestMatch.specificity) {
            bestMatch = { route: item.href, specificity }
          }
        } else if (pathname.startsWith(item.href + "/")) {
          // Partial match - specificity based on path segments
          const specificity = item.href.split("/").length
          if (specificity > bestMatch.specificity) {
            bestMatch = { route: item.href, specificity }
          }
        }

        // Check children
        if (item.children) {
          checkRoutes(item.children, item.href)
        }
      })
    }

    checkRoutes(routes)

    console.log("Best matching route:", bestMatch.route, "with specificity:", bestMatch.specificity)
    setActiveRoute(bestMatch.route)

    // Auto-expand parent groups of active items
    routes.forEach((route) => {
      if (route.children) {
        const hasActiveChild = route.children.some(
          (child) =>
            child.href === bestMatch.route ||
            (bestMatch.route.startsWith(child.href + "/") && child.href !== "/dashboard"),
        )

        if (hasActiveChild) {
          setOpenGroups((prev) => ({
            ...prev,
            [route.title]: true,
          }))
        }
      }
    })
  }, [pathname, isAdmin])

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
    console.log(`Group ${title} toggled`)
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const profileImageUrl = `${BACKEND_SERVER_URL}/v1/employee/${user.id}/profileImg`

  // Check if a route is active
  const isRouteActive = (href: string): boolean => {
    return href === activeRoute
  }

  // Check if a parent route has an active child
  const hasActiveChild = (item: NavItem): boolean => {
    if (!item.children) return false

    return item.children.some(
      (child) =>
        child.href === activeRoute ||
        (activeRoute && activeRoute.startsWith(child.href + "/") && child.href !== "/dashboard"),
    )
  }

  // Animation variants for sidebar
  const sidebarVariants = {
    expanded: { width: "220px", transition: { duration: 0.3, ease: "easeInOut" } },
    collapsed: { width: "60px", transition: { duration: 0.3, ease: "easeInOut" } },
  }

  // Animation variants for content that appears/disappears
  const contentVariants = {
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
        delay: 0.1,
      },
    },
    hidden: {
      opacity: 0,
      x: -10,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  }

  // Animation variants for icons
  const iconVariants = {
    expanded: { scale: 1, transition: { duration: 0.2 } },
    collapsed: { scale: 1.2, transition: { duration: 0.2 } },
  }

  // Animation variants for mobile menu button
  const mobileMenuButtonVariants = {
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hidden: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  }

  // Animation variants for child items
  const childItemVariants = {
    open: {
      height: "auto",
      opacity: 1,
      transition: {
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.3, ease: "easeInOut" },
      },
    },
    closed: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2, ease: "easeInOut" },
      },
    },
  }

  const renderNavItem = (item: NavItem, isNested = false, forMobile = false) => {
    // Skip items that should not be visible to this user
    if (!item.visible || (item.adminOnly && !isAdmin)) {
      return null
    }

    // Check if this item is active
    const isActive = isRouteActive(item.href)
    const itemHasActiveChild = hasActiveChild(item)

    console.log(
      `Rendering route: ${item.title}, href: ${item.href}, isActive: ${isActive}, hasActiveChild: ${itemHasActiveChild}`,
    )

    // If the item has children, render a collapsible
    if (item.children && item.children.length > 0) {
      const hasVisibleChildren = item.children.some(
        (child) => child.visible && (!child.adminOnly || (child.adminOnly && isAdmin)),
      )

      if (!hasVisibleChildren) {
        // If no visible children, render as a normal link
        return (
          <motion.div key={item.href} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "transparent",
                isCollapsed && !forMobile && "justify-center px-0",
                isNested && "pl-6", // Reduced padding for nested items
              )}
              onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
            >
              <motion.div variants={iconVariants} animate={isCollapsed && !forMobile ? "collapsed" : "expanded"}>
                <item.icon className={cn("h-4 w-4", isActive && "h-[18px] w-[18px]")} />
              </motion.div>
              {(!isCollapsed || forMobile) && (
                <AnimatePresence>
                  <motion.span variants={contentVariants} initial="hidden" animate="visible" exit="hidden">
                    {item.title}
                  </motion.span>
                </AnimatePresence>
              )}
            </Link>
          </motion.div>
        )
      }

      // For expanded sidebar
      if (!isCollapsed || forMobile) {
        return (
          <div key={item.title} className="space-y-0.5 py-0.5">
            <Collapsible
              open={openGroups[item.title] || itemHasActiveChild}
              onOpenChange={() => toggleGroup(item.title)}
            >
              <div className="flex items-center">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Link
                    prefetch={true}
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
                </motion.div>
                <CollapsibleTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 w-7 p-0",
                        (isActive || itemHasActiveChild) && "hidden", // Hide when active or has active child
                      )}
                    >
                      <motion.div animate={{ rotate: openGroups[item.title] ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        {openGroups[item.title] ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </motion.div>
                    </Button>
                  </motion.div>
                </CollapsibleTrigger>
              </div>
              <motion.div
                variants={childItemVariants}
                initial="closed"
                animate={openGroups[item.title] || itemHasActiveChild ? "open" : "closed"}
                className="overflow-hidden"
              >
                <div className="mt-0.5 space-y-0.5">
                  {item.children.map((child) => renderNavItem(child, true, forMobile))}
                </div>
              </motion.div>
            </Collapsible>
          </div>
        )
      }

      // For collapsed sidebar - show parent and all children when parent is active
      const isParentActive = isActive || itemHasActiveChild

      return (
        <div key={item.title} className="space-y-0.5 py-0.5">
          {/* Main parent icon */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link
              prefetch={true}
              href={item.children[0].href}
              className={cn(
                "flex justify-center rounded-md px-0 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isParentActive ? "bg-accent text-accent-foreground" : "transparent",
              )}
              onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
            >
              <motion.div variants={iconVariants} animate="collapsed">
                <item.icon className={cn("h-4 w-4", isParentActive && "h-[18px] w-[18px] text-accent-foreground")} />
              </motion.div>
            </Link>
          </motion.div>

          {/* Show all child icons when parent is active */}
          <AnimatePresence>
            {isParentActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-0.5 mt-0.5"
              >
                {item.children
                  .filter((child) => child.visible && (!child.adminOnly || (child.adminOnly && isAdmin)))
                  .map((child, index) => {
                    const isChildActive = isRouteActive(child.href)
                    return (
                      <motion.div
                        key={child.href}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Link
                          prefetch={true}
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
                      </motion.div>
                    )
                  })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    // Regular nav item
    if (isNested) {
      const isItemActive = isRouteActive(item.href)
      return (
        <motion.div key={item.href} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            prefetch={true}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isItemActive ? "bg-accent text-accent-foreground" : "transparent",
              isCollapsed && !forMobile && "justify-center px-0",
              isCollapsed && !forMobile ? "bg-muted/40" : "pl-6", // Use background color instead of border
            )}
            onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
          >
            <motion.div variants={iconVariants} animate={isCollapsed && !forMobile ? "collapsed" : "expanded"}>
              <item.icon className={cn("h-4 w-4", isItemActive && "h-[18px] w-[18px] text-accent-foreground")} />
            </motion.div>
            {(!isCollapsed || forMobile) && (
              <AnimatePresence>
                <motion.span variants={contentVariants} initial="hidden" animate="visible" exit="hidden">
                  {item.title}
                </motion.span>
              </AnimatePresence>
            )}
          </Link>
        </motion.div>
      )
    }

    return (
      <motion.div key={item.href} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link
          prefetch={true}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isActive ? "bg-accent text-accent-foreground" : "transparent",
            isCollapsed && !forMobile && "justify-center px-0",
          )}
          onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
        >
          <motion.div variants={iconVariants} animate={isCollapsed && !forMobile ? "collapsed" : "expanded"}>
            <item.icon className={cn("h-4 w-4", isActive && "h-[18px] w-[18px] text-accent-foreground")} />
          </motion.div>
          {(!isCollapsed || forMobile) && (
            <AnimatePresence>
              <motion.span variants={contentVariants} initial="hidden" animate="visible" exit="hidden">
                {item.title}
              </motion.span>
            </AnimatePresence>
          )}
        </Link>
      </motion.div>
    )
  }

  // Desktop sidebar - fixed position to prevent scrolling
  const DesktopSidebar = (
    <motion.div
      variants={sidebarVariants}
      initial={isCollapsed ? "collapsed" : "expanded"}
      animate={isCollapsed ? "collapsed" : "expanded"}
      className="hidden md:flex flex-col h-screen border-r bg-background fixed top-0 left-0"
    >
      <div className="flex h-12 items-center px-3 border-b">
        <Link prefetch={true} href="/dashboard" className="flex items-center gap-2 font-semibold">
          {!isCollapsed && (
            <AnimatePresence>
              <motion.span
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="text-sm"
              >
                {SCHOOL_NAME}
              </motion.span>
            </AnimatePresence>
          )}
        </Link>
        <div className="ml-auto">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="sm" // Smaller button
              onClick={toggleSidebar}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="h-7 w-7 p-0" // Smaller button
            >
              <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
                {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </motion.div>
            </Button>
          </motion.div>
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
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("w-full h-7", isCollapsed ? "justify-center px-0" : "justify-start")} // Smaller height
                >
                  <motion.div variants={iconVariants} animate={isCollapsed ? "collapsed" : "expanded"}>
                    {theme === "system" ? (
                      <Laptop className="h-4 w-4" />
                    ) : theme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </motion.div>
                  {!isCollapsed && (
                    <AnimatePresence>
                      <motion.span
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="ml-2 text-xs"
                      >
                        {`${theme.slice(0, 1).toUpperCase()}${theme.slice(1)}`}
                      </motion.span>
                    </AnimatePresence>
                  )}
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onHoverStart={() => {
            router.prefetch("/dashboard/profile")
          }}
          onClick={() => {
            router.push("/dashboard/profile")
          }}
          className={cn("flex items-center gap-2 mt-3 cursor-pointer", isCollapsed && "justify-center")}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={profileImageUrl || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <AnimatePresence>
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex flex-col overflow-hidden"
              >
                <span className="font-medium truncate text-xs">{user.name}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
        <form action={handleSignOut} className="mt-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              size="sm"
              className={cn("w-full h-7", isCollapsed ? "justify-center px-0" : "justify-start")} // Smaller height
              type="submit"
            >
              <motion.div variants={iconVariants} animate={isCollapsed ? "collapsed" : "expanded"}>
                <LogOut className="h-4 w-4" />
              </motion.div>
              {!isCollapsed && (
                <AnimatePresence>
                  <motion.span
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="ml-2 text-xs"
                  >
                    Log out
                  </motion.span>
                </AnimatePresence>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  )

  // Mobile sidebar (using a Sheet component)
  const MobileSidebar = (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <motion.div
          variants={mobileMenuButtonVariants}
          initial="hidden"
          animate={showMobileMenu ? "visible" : "hidden"}
        >
          <Button variant="ghost" size="icon" className="md:hidden fixed top-2 left-2 z-50">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </motion.div>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[250px]">
        <motion.div
          initial={{ x: -250 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="flex flex-col h-full"
        >
          <div className="flex h-14 items-center px-4 border-b">
            <Link prefetch={true} href="/dashboard" className="flex items-center gap-3 font-semibold">
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                {SCHOOL_NAME}
              </motion.span>
            </Link>
          </div>

          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-2">
              {routes.map((route, index) => {
                // For mobile, always render with forMobile=true to show nested items
                return (
                  <motion.div
                    key={route.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {renderNavItem(route, false, true)}
                  </motion.div>
                )
              })}
            </nav>
          </div>

          <div className="border-t p-4">
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Settings className="h-4 w-4" />
                      <span className="ml-2">Theme</span>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </DropdownMenuItem>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </DropdownMenuItem>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <Laptop className="mr-2 h-4 w-4" />
                      System
                    </DropdownMenuItem>
                  </motion.div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 mt-4"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={profileImageUrl || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate">{user.name}</span>
                <span className="text-sm text-muted-foreground truncate">{user.email}</span>
              </div>
            </motion.div>

            <form action={handleSignOut} className="mt-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" className="w-full justify-start" type="submit">
                  <LogOut className="h-4 w-4" />
                  <span className="ml-2">Log out</span>
                </Button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  )

  // Add padding to the main content to account for the fixed sidebar
  return (
    <>
      {DesktopSidebar}
      {MobileSidebar}
      <motion.div
        className={cn("md:pt-0 pt-14")}
        animate={{
          paddingLeft: isLargeScreen ? (isCollapsed ? "60px" : "220px") : "0px",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      ></motion.div>
    </>
  )
}
