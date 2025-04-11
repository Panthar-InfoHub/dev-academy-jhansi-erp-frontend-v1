"use client"

import { MapPin } from "lucide-react"

interface VehicleMapPlaceholderProps {
  lat: number | null
  long: number | null
  vehicleNumber: string
}

export function VehicleMapPlaceholder({ lat, long, vehicleNumber }: VehicleMapPlaceholderProps) {
  return (
    <div className="w-full h-[500px] bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center p-6">
      {lat && long ? (
        <div className="text-center">
          <div className="bg-primary/10 p-8 rounded-full inline-flex items-center justify-center mb-4">
            <MapPin className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{vehicleNumber}</h3>
          <p className="text-muted-foreground mb-4">Current Location</p>
          <div className="bg-background p-4 rounded-md shadow-sm">
            <p className="font-mono">Latitude: {lat.toFixed(6)}</p>
            <p className="font-mono">Longitude: {long.toFixed(6)}</p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-muted p-8 rounded-full inline-flex items-center justify-center mb-4">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{vehicleNumber}</h3>
          <p className="text-muted-foreground">No location data available</p>
        </div>
      )}
    </div>
  )
}
