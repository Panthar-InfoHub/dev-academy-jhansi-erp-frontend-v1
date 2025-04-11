"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { RefreshCw, ShieldAlert } from "lucide-react"
import { getAllAdmins } from "@/lib/actions/admin"
import { makeAdmin, removeAdmin } from "@/lib/actions/employee"
import { useSession } from "next-auth/react"

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  useEffect(() => {
    fetchAdmins()
  }, [])

  async function fetchAdmins() {
    setIsLoading(true)
    try {
      const response = await getAllAdmins()
      if (response?.status === "SUCCESS" && response.data) {
        setAdmins(response.data.admins)
      } else {
        toast.error(response?.message || "Failed to fetch admins")
      }
    } catch (error) {
      console.error("Error fetching admins:", error)
      toast.error("An error occurred while fetching admins")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMakeAdmin = async (targetEmployeeId: string) => {
    setIsActionLoading(true)

    toast.promise(makeAdmin(currentUserId, targetEmployeeId), {
      loading: "Granting admin permissions...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          fetchAdmins()
          return "Admin permissions granted successfully"
        } else {
          throw new Error(result?.message || "Failed to grant admin permissions")
        }
      },
      error: (error) => {
        console.error("Error granting admin permissions:", error)
        return "An error occurred while granting admin permissions"
      },
      finally: () => {
        setIsActionLoading(false)
      },
    })
  }

  const handleRemoveAdmin = async (targetEmployeeId: string) => {
    setIsActionLoading(true)

    toast.promise(removeAdmin(currentUserId, targetEmployeeId), {
      loading: "Removing admin permissions...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          fetchAdmins()
          return "Admin permissions removed successfully"
        } else {
          throw new Error(result?.message || "Failed to remove admin permissions")
        }
      },
      error: (error) => {
        console.error("Error removing admin permissions:", error)
        return "An error occurred while removing admin permissions"
      },
      finally: () => {
        setIsActionLoading(false)
      },
    })
  }

  // Function to check if the employee is the current user
  const isCurrentUser = (employeeId: string) => {
    return employeeId === currentUserId
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Administrators</h1>
        <Button variant="outline" onClick={fetchAdmins} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrators List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Work Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Loading administrators...
                    </TableCell>
                  </TableRow>
                ) : admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No administrators found
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>{admin.user.name}</TableCell>
                      <TableCell>{admin.user.workRole}</TableCell>
                      <TableCell>
                        <Badge variant={admin.user.isActive ? "default" : "outline"}>
                          {admin.user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!isCurrentUser(admin.id) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAdmin(admin.id)}
                              disabled={isActionLoading}
                            >
                              <ShieldAlert className="h-4 w-4 mr-2" />
                              Remove Admin
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">Current Admin</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Add New Administrator</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select an employee to grant administrator permissions.</p>
          {/* Implement a dropdown or search to select an employee */}
          {/* Add a button to trigger the makeAdmin action */}
        </CardContent>
      </Card>
    </div>
  )
}
