import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2 } from "lucide-react";

interface DailyProgressProps {
  completed: number;
  goal: number;
  progressPercentage: number;
  isComplete: boolean;
}

export function DailyProgress({
  completed,
  goal,
  progressPercentage,
  isComplete,
}: DailyProgressProps) {
  const remaining = goal - completed;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Today's Progress
        </h3>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
            isComplete
              ? "bg-success/15 text-success"
              : "bg-info/15 text-info"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>
            {completed}/{goal}
          </span>
        </div>
      </div>

      <Progress value={progressPercentage} className="h-3 mb-3" />

      <div className="flex items-center justify-between">
        {isComplete ? (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Nice work 👏 Goal complete!</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{remaining}</span>{" "}
            {remaining === 1 ? "quiz" : "quizzes"} to go
          </p>
        )}
        <span className="text-xs text-muted-foreground">
          {Math.round(progressPercentage)}%
        </span>
      </div>
    </div>
  );
}
