import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton({ height = "h-[260px]" }: { height?: string }) {
  return (
    <Card>
      <CardHeader className="pb-3 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className={`w-full ${height} rounded-md`} />
      </CardContent>
    </Card>
  )
}

export function AnalyticsSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <ChartSkeleton height="h-[300px]" />
      </div>
    </div>
  )
}
