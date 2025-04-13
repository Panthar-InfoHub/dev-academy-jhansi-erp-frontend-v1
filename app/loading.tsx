import { Skeleton } from "@/components/ui/skeleton"

function DashboardSkeleton() {
  console.log("Rendering dashboard skeleton")

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`stat-card-${index}`} className="p-6 rounded-lg border bg-card">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-[120px]" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full mt-4" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart skeleton */}
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[120px]" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Bar chart skeleton */}
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[120px]" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-[150px]" />
          <div className="space-y-2">
            {/* Table header */}
            <div className="flex gap-4 py-3 border-b">
              <Skeleton className="h-4 w-[30%]" />
              <Skeleton className="h-4 w-[20%]" />
              <Skeleton className="h-4 w-[20%]" />
              <Skeleton className="h-4 w-[30%]" />
            </div>
            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`table-row-${index}`} className="flex gap-4 py-4 border-b">
                <Skeleton className="h-4 w-[30%]" />
                <Skeleton className="h-4 w-[20%]" />
                <Skeleton className="h-4 w-[20%]" />
                <Skeleton className="h-4 w-[30%]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardSkeleton
