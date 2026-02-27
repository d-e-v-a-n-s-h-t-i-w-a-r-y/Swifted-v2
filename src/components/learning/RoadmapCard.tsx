import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface RoadmapCardProps {
  title: string;
  description: string;
  lessonsCount: number;
  completedLessons: number;
  className?: string;
  style?: CSSProperties;
}

export function RoadmapCard({ 
  title, 
  description,
  lessonsCount, 
  completedLessons,
  className,
  style
}: RoadmapCardProps) {
  const progress = Math.round((completedLessons / lessonsCount) * 100);
  
  return (
    <article className={cn("learning-card animate-slide-up", className)} style={style}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground leading-snug mb-1.5">
            {title}
          </h3>
          <p className="body-text line-clamp-2 mb-3">
            {description}
          </p>
          
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              {completedLessons}/{lessonsCount} lessons
            </span>
            <span className="text-primary font-medium">{progress}%</span>
          </div>
          
          <div className="progress-bar mt-2">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <ChevronRight size={20} className="text-muted-foreground" />
        </div>
      </div>
    </article>
  );
}
