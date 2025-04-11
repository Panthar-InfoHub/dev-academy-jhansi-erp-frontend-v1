"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { customUser } from "@/auth"
import { Users, GraduationCap, User, LogOut, School, Car, Search, Plus } from "lucide-react"

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { getAllClassrooms } from "@/lib/actions/classroom"
import { handleSignOut } from "@/lib/actions/loginActions"
import { AddStudentDialog } from "@/components/students/add-student-dialog"
import { AddEmployeeDialog } from "@/components/employees/add-employee-dialog"

interface CommandPaletteProps {
  user: customUser | null
}

export function CommandPalette({ user }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const isAdmin = user?.isAdmin || false

  const [classes, setClasses] = useState<any[]>([])
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false)
  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false)

  const fetchClasses = useCallback(async () => {
    try {
      const classrooms = await getAllClassrooms()
      setClasses(classrooms || [])
    } catch (error) {
      console.error("Error fetching classrooms:", error)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchClasses()
    }
  }, [open, fetchClasses])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleNavigation = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {isAdmin && (
            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  setAddStudentDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Student
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  setAddEmployeeDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Employee
              </CommandItem>
              <CommandItem>
                <School className="mr-2 h-4 w-4" />
                Go to Class
                <CommandList>
                  {classes.map((classroom: any) => (
                    <CommandItem
                      key={classroom.id}
                      onSelect={() => {
                        setOpen(false)
                        router.push(`/dashboard/class/${classroom.id}`)
                      }}
                    >
                      {classroom.name}
                    </CommandItem>
                  ))}
                </CommandList>
              </CommandItem>
              <CommandItem>
                <School className="mr-2 h-4 w-4" />
                Go to Class Section
                <CommandList>
                  {classes.map((classroom: any) => (
                    <CommandGroup key={classroom.id} heading={classroom.name}>
                      {classroom.classSections?.map((section: any) => (
                        <CommandItem
                          key={section.id}
                          onSelect={() => {
                            setOpen(false)
                            router.push(`/dashboard/class/${classroom.id}/section/${section.id}`)
                          }}
                        >
                          {section.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </CommandItem>
            </CommandGroup>
          )}

          <CommandGroup heading="Pages">
            {isAdmin && (
              <CommandItem onSelect={() => handleNavigation("/dashboard/employees")}>
                <Users className="mr-2 h-4 w-4" />
                Employees
              </CommandItem>
            )}
            <CommandItem onSelect={() => handleNavigation("/dashboard/profile")}>
              <User className="mr-2 h-4 w-4" />
              My Profile
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/dashboard/students/search")}>
              <Search className="mr-2 h-4 w-4" />
              Student Search
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/dashboard/students")}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Manage Students
            </CommandItem>
            {isAdmin && (
              <CommandItem onSelect={() => handleNavigation("/dashboard/vehicles")}>
                <Car className="mr-2 h-4 w-4" />
                Vehicle
              </CommandItem>
            )}
            <CommandItem onSelect={() => handleSignOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Dialogs */}
      <AddStudentDialog
        open={addStudentDialogOpen}
        onOpenChange={setAddStudentDialogOpen}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {isAdmin && (
        <AddEmployeeDialog
          open={addEmployeeDialogOpen}
          onOpenChange={setAddEmployeeDialogOpen}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </>
  )
}
