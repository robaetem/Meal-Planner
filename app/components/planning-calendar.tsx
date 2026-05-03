"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CalendarDay = {
  key: string;
  dayNumber: number;
  weekday: string;
  isToday: boolean;
};

type CalendarPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  color: string;
  rangeLabel: string;
  collectAndGoPickupDate: string | null;
};

type DaySummary = {
  date: string;
  lines: string[];
};

type PlanningCalendarProps = {
  days: CalendarDay[];
  periods: CalendarPeriod[];
  summaries: DaySummary[];
};

function isBetween(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate;
}

export function PlanningCalendar({ days, periods, summaries }: PlanningCalendarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const summaryMap = useMemo(
    () => new Map(summaries.map((summary) => [summary.date, summary.lines])),
    [summaries],
  );

  const selectedStart = dragStart && dragEnd ? (dragStart <= dragEnd ? dragStart : dragEnd) : null;
  const selectedEnd = dragStart && dragEnd ? (dragStart <= dragEnd ? dragEnd : dragStart) : null;

  function finishDrag(endDate: string) {
    if (!dragStart) return;
    const startDate = dragStart <= endDate ? dragStart : endDate;
    const finalEndDate = dragStart <= endDate ? endDate : dragStart;
    setDragStart(null);
    setDragEnd(null);

    startTransition(async () => {
      const response = await fetch("/api/planning-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate: finalEndDate }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { id: string };
      router.push(`/planningen/${data.id}`);
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card" aria-label="Planning kalender">
      <div className="hidden grid-cols-7 border-b bg-muted/50 md:grid" aria-hidden="true">
        {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((weekday) => (
          <div className="px-3 py-2 text-center text-xs font-medium text-muted-foreground" key={weekday}>
            {weekday}
          </div>
        ))}
      </div>

      <div className={cn("grid md:grid-cols-7", isPending && "pointer-events-none opacity-70")}>
        {days.map((day) => {
          const dayPeriods = periods.filter((period) =>
            isBetween(day.key, period.startDate, period.endDate),
          );
          const lines = summaryMap.get(day.key) ?? [];
          const selected =
            selectedStart && selectedEnd && isBetween(day.key, selectedStart, selectedEnd);

          return (
            <div
              className={cn(
                "min-h-32 cursor-crosshair border-b p-2 md:min-h-36 md:border-r [&:nth-child(7n)]:border-r-0",
                selected && "bg-muted",
              )}
              key={day.key}
              onMouseDown={() => {
                setDragStart(day.key);
                setDragEnd(day.key);
              }}
              onMouseEnter={() => {
                if (dragStart) setDragEnd(day.key);
              }}
              onMouseUp={() => finishDrag(day.key)}
              role="button"
              tabIndex={0}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium capitalize text-muted-foreground md:hidden">
                  {day.weekday}
                </span>
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-sm",
                    day.isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {day.dayNumber}
                </span>
              </div>

              <div className="flex min-h-7 flex-col gap-1">
                {dayPeriods.map((period) => {
                  const isStart = period.startDate === day.key;
                  const isPickup = period.collectAndGoPickupDate === day.key;
                  return (
                    <Link
                      className={cn(
                        badgeVariants({ variant: "secondary" }),
                        "h-auto min-h-6 w-full justify-between rounded-md border-l-4 px-2",
                      )}
                      href={`/planningen/${period.id}`}
                      key={period.id}
                      onMouseDown={(event) => event.stopPropagation()}
                      style={{ borderLeftColor: period.color }}
                    >
                      <span>{isStart ? period.rangeLabel : "\u00a0"}</span>
                      {isPickup ? <span>Collect & Go</span> : null}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-2 flex flex-col gap-1">
                {lines.slice(0, 3).map((line) => (
                  <p className="truncate text-xs text-muted-foreground" key={line}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
