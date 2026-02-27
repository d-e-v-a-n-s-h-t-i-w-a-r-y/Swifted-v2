import { Target, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface DailyGoalCardProps {
  title: string;
  subtitle: string;
  completed: boolean;
  className?: string;
  style?: CSSProperties;
}

export function DailyGoalCard({ title, subtitle, completed, className, style }: DailyGoalCardProps) {
  return (
    <article 
      className={cn(
        "learning-card flex items-center gap-4 animate-fade-in",
        completed && "opacity-60",
        className
      )}
      style={style}
    >
      <div className={cn(
        "w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors",
        completed 
          ? "bg-primary/20 text-primary" 
          : "bg-secondary text-muted-foreground"
      )}>
        {completed ? <Check size={20} strokeWidth={2.5} /> : <Target size={20} />}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-medium leading-snug",
          completed ? "text-muted-foreground line-through" : "text-foreground"
        )}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {subtitle}
        </p>
      </div>
    </article>
  );
}
