import { Skeleton } from '@/components/ui/skeleton'

export function ProjectFormSkeleton() {
  return (
    <div className="space-y-4">
      {/* Name field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Base URL field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-64" />
      </div>

      {/* Token field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-40" />
      </div>

      {/* Browser field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-40" />
      </div>

      {/* Selector field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-56" />
      </div>

      {/* Width and Height fields (grid) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Page Paths field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Submit buttons */}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}
