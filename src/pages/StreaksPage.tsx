import { Link } from "react-router-dom";
import { Flame, ArrowRight, Calendar, Map, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStreaks } from "@/hooks/useStreaks";
import { StreakCalendar } from "@/components/streaks/StreakCalendar";
import { cn } from "@/lib/utils";
import { GlobalHeader } from "@/components/layout/GlobalHeader";

const TIPS = [
  "Studies show reading just 30 minutes a day improves focus and memory.",
  "Small steps daily beat motivation bursts.",
  "Consistency builds clarity.",
  "You don't need to rush. Just show up today.",
  "Your brain rewires itself a little each time you learn something new.",
];

export default function StreaksPage() {
  const {
    currentStreak,
    longestStreak,
    quizzesToday,
    quizGoal,
    dailyGoalComplete,
    progressPercentage,
    lastActiveRoadmap,
    missedYesterday,
    getWeeklyStreak,
  } = useStreaks();

  const weeklyData = getWeeklyStreak();

  const tipIndex = new Date().getDate() % TIPS.length;

  const getMotivationalMessage = () => {
    if (missedYesterday) return "No worries. Let's start fresh today.";
    if (dailyGoalComplete) return "You've shown up today — that's what matters. 🎉";
    if (currentStreak > 0) return "Don't break the chain — keep learning today.";
    return "One quiz at a time. You've got this.";
  };

  return (
    <div className="px-4 sm:px-5 pt-6 pb-6 animate-fade-in">
      {/* Global Header */}
      <GlobalHeader />

      {/* Page Title */}
      <header className="mb-6 sm:mb-8">
        <h2 className="text-xl font-semibold text-foreground">Your Streak</h2>
        <p className="text-muted-foreground text-xs sm:text-sm font-medium mt-1">
          {getMotivationalMessage()}
        </p>
      </header>

      {/* Main Streak Display */}
      <Card className="mb-5 overflow-hidden bg-gradient-to-br from-warning/10 via-background to-accent/20 border-warning/20">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className={cn(
                "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center",
                currentStreak > 0
                  ? "bg-warning text-warning-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              <Flame className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2.5} />
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold text-foreground mb-1">
              {currentStreak}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentStreak === 1 ? "day streak" : "day streak"}
            </p>
          </div>

          {longestStreak > 0 && (
            <div className="mt-4 text-center">
              <span className="text-xs text-muted-foreground">
                Longest streak:{" "}
                <span className="font-semibold text-foreground">{longestStreak} days</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Progress */}
      <div className="mb-5">
        <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Today's Progress
            </h3>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                dailyGoalComplete
                  ? "bg-success/15 text-success"
                  : "bg-info/15 text-info"
              )}
            >
              {dailyGoalComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>{quizzesToday}/{quizGoal} quizzes</span>
            </div>
          </div>

          <Progress value={progressPercentage} className="h-3 mb-3" />

          <p className="text-sm text-muted-foreground">
            {dailyGoalComplete
              ? "Nice work 👏 You've completed today's learning."
              : `${quizGoal - quizzesToday} more ${quizGoal - quizzesToday === 1 ? "quiz" : "quizzes"} to earn today's streak point.`}
          </p>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="mb-6">
        <StreakCalendar weeklyData={weeklyData} />
      </div>

      {/* Motivational Tip */}
      <div className="mb-5 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20">
        <p className="text-xs sm:text-sm text-accent-foreground/80 italic leading-relaxed">
          "{TIPS[tipIndex]}"
        </p>
      </div>

      {/* Action Cards */}
      <div className="space-y-3">
        <Link to="/daily">
          <Card className="cursor-pointer hover:border-primary/50 transition-all group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/15">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Take Today's Quiz
                </h3>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Quick quiz to keep your streak
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>

        {lastActiveRoadmap ? (
          <Link to="/roadmaps">
            <Card className="cursor-pointer hover:border-info/50 transition-all group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-info/15">
                  <Map className="w-5 h-5 text-info" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-info transition-colors">
                    Pick Up Where You Left Off
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Continue: Unit {lastActiveRoadmap.unitIndex + 1} – {lastActiveRoadmap.unitTitle}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-info transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link to="/roadmaps">
            <Card className="cursor-pointer hover:border-info/50 transition-all group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-info/15">
                  <Map className="w-5 h-5 text-info" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-info transition-colors">
                    Start a Learning Path
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Choose a roadmap to begin
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-info transition-colors" />
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* How Streaks Work */}
      <Card className="mt-6 bg-secondary/30 border-border/30">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">How Streaks Work</h4>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Complete {quizGoal} quizzes in a day to earn a streak point
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Quizzes from Daily, Roadmaps, and Snippets all count
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Miss a day? No worries — just pick it back up tomorrow
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
