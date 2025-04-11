import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-6">
      <Skeleton className="h-10 w-[200px] mb-6" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(null)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-[120px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[80px] mb-2" />
                <Skeleton className="h-4 w-[140px]" />
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
