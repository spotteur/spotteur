import { Skeleton } from "@/components/ui/skeleton";

export function AppSkeleton() {
  return (
    <div className="flex items-center space-x-4 justify-between">
      <Skeleton className="w-1/6 h-screen" />
      <div className="space-y-5 flex flex-col self-start w-full">
        <Skeleton className="h-24" />
        <Skeleton className="h-screen w-full" />
      </div>
    </div>
  );
}
