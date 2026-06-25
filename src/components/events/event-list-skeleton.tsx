import { Skeleton } from "@/components/ui/skeleton";

type EventListSkeletonProps = {
  cards?: number;
};

export function EventListSkeleton({ cards = 3 }: EventListSkeletonProps) {
  return (
    <div className="flex flex-col gap-8" aria-hidden>
      <section className="flex flex-col gap-4">
        <Skeleton className="h-7 w-44" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: cards }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
