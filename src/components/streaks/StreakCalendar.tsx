import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface DayData {
  date: Date;
  dateKey: string;
  completed: number;
  isGoalMet: boolean;
  isToday: boolean;
}

interface StreakCalendarProps {
  weeklyData: DayData[];
}

export function StreakCalendar({ weeklyData }: StreakCalendarProps) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        This Week
      </h3>
      <div className="flex justify-between gap-1">
        {weeklyData.map((day) => (
          <div key={day.dateKey} className="flex flex-col items-center gap-2">
            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
              {format(day.date, "EEE")}
            </span>
            <div
              className={cn(
                "w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all",
                day.isGoalMet
                  ? "bg-warning text-warning-foreground"
                  : day.isToday
                  ? "bg-secondary border-2 border-warning/50"
                  : "bg-secondary/50"
              )}
            >
              {day.isGoalMet ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
              ) : day.isToday ? (
                <span className="text-[9px] font-bold text-info">{day.completed}/10</span>
              ) : (
                <span className="text-xs text-muted-foreground">–</span>
              )}
            </div>
            <span
              className={cn(
                "text-[10px] sm:text-xs",
                day.isToday ? "text-warning font-semibold" : "text-muted-foreground"
              )}
            >
              {format(day.date, "d")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
