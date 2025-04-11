import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProfileLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[180px]" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Skeleton className="h-10 w-[300px] mb-6" />

        <div className="grid gap-6 md:grid-cols-2">
          {Array(6)
            .fill(null)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-[120px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}
