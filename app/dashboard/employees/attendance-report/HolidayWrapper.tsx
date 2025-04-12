"use client"

import { useState } from "react";
import { SetHolidayDialog } from "@/components/employees/set-holiday-dialog";
import { Calendar1Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SetDayAsHolidayWrapper() {
  
  const [openDialog, setOpenDialog] = useState(false)
  
  return (
    <div>
      <Button variant={"default"}
      onClick={() => setOpenDialog(true)}
      >
          <Calendar1Icon className="h-4 w-4 mr-2" />
           Set Day as Holiday
        </Button>
      <SetHolidayDialog open={openDialog} onOpenChange={setOpenDialog} />
    </div>
  )
}