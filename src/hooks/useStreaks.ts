import { useState, useEffect, useCallback } from "react";
import { format, subDays, isToday } from "date-fns";
import { toast } from "sonner";

const DAILY_QUIZ_GOAL = 10;

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  quizzesToday: number;
  streakHistory: Record<string, number>; // date -> quiz count
  lastActiveRoadmap: {
    categoryId: string;
    roadmapIndex: number;
    unitIndex: number;
    unitTitle: string;
  } | null;
  milestones: {
    firstStreak: boolean;
    firstRoadmapUnit: boolean;
  };
}

const STREAKS_KEY = "swifted-streaks";

const defaultStreakData: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  quizzesToday: 0,
  streakHistory: {},
  lastActiveRoadmap: null,
  milestones: { firstStreak: false, firstRoadmapUnit: false },
};

export function useStreaks() {
  const [streakData, setStreakData] = useState<StreakData>(() => {
    const stored = localStorage.getItem(STREAKS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<StreakData>;
      const today = format(new Date(), "yyyy-MM-dd");
      const history = parsed.streakHistory || {};
      const todayCount = history[today] || 0;
      return {
        ...defaultStreakData,
        ...parsed,
        milestones: { ...defaultStreakData.milestones, ...(parsed.milestones || {}) },
        streakHistory: history,
        quizzesToday: todayCount,
      };
    }
    return defaultStreakData;
  });

  useEffect(() => {
    localStorage.setItem(STREAKS_KEY, JSON.stringify(streakData));
  }, [streakData]);

  const isDayComplete = useCallback((count: number) => count >= DAILY_QUIZ_GOAL, []);

  const calculateStreak = useCallback((history: Record<string, number>): number => {
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

    const todayDone = (history[today] || 0) >= DAILY_QUIZ_GOAL;
    const yesterdayDone = (history[yesterday] || 0) >= DAILY_QUIZ_GOAL;

    if (!todayDone && !yesterdayDone) return 0;

    let streak = 0;
    let checkDate = todayDone ? new Date() : subDays(new Date(), 1);

    while (true) {
      const dateKey = format(checkDate, "yyyy-MM-dd");
      if ((history[dateKey] || 0) >= DAILY_QUIZ_GOAL) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    return streak;
  }, []);

  const recordQuizAttempt = useCallback(
    (source: "daily" | "roadmap" | "snippet" = "snippet") => {
      setStreakData((prev) => {
        const today = format(new Date(), "yyyy-MM-dd");
        const prevCount = prev.streakHistory[today] || 0;
        const newCount = prevCount + 1;

        const newHistory = { ...prev.streakHistory, [today]: newCount };
        const newStreak = calculateStreak(newHistory);
        const wasComplete = isDayComplete(prevCount);
        const nowComplete = isDayComplete(newCount);

        // Show milestone toasts
        if (!wasComplete && nowComplete) {
          toast("Nice work 👏", {
            description: "You've completed today's learning goal!",
          });
          if (!prev.milestones.firstStreak && newStreak >= 1) {
            setTimeout(() => {
              toast("That's a streak! 🧠", {
                description: "Your brain likes consistency. Keep it going!",
              });
            }, 1500);
          }
        }

        return {
          ...prev,
          quizzesToday: newCount,
          streakHistory: newHistory,
          currentStreak: newStreak,
          longestStreak: Math.max(prev.longestStreak, newStreak),
          milestones: {
            ...prev.milestones,
            firstStreak: prev.milestones.firstStreak || newStreak >= 1,
          },
        };
      });
    },
    [calculateStreak, isDayComplete]
  );

  const recordRoadmapUnitComplete = useCallback(() => {
    setStreakData((prev) => {
      if (!prev.milestones.firstRoadmapUnit) {
        toast("Progress unlocked 🎯", {
          description: "You completed your first roadmap unit. Keep going!",
        });
      }
      return {
        ...prev,
        milestones: { ...prev.milestones, firstRoadmapUnit: true },
      };
    });
  }, []);

  const updateLastActiveRoadmap = useCallback(
    (categoryId: string, roadmapIndex: number, unitIndex: number, unitTitle: string) => {
      setStreakData((prev) => ({
        ...prev,
        lastActiveRoadmap: { categoryId, roadmapIndex, unitIndex, unitTitle },
      }));
    },
    []
  );

  const getWeeklyStreak = useCallback(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, "yyyy-MM-dd");
      const count = streakData.streakHistory[dateKey] || 0;
      days.push({
        date,
        dateKey,
        completed: count,
        isGoalMet: count >= DAILY_QUIZ_GOAL,
        isToday: isToday(date),
      });
    }
    return days;
  }, [streakData.streakHistory]);

  // Check if user missed yesterday (for gentle nudge)
  const missedYesterday = (() => {
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const count = streakData.streakHistory[yesterday] || 0;
    return count < DAILY_QUIZ_GOAL && streakData.currentStreak === 0 && Object.keys(streakData.streakHistory).length > 0;
  })();

  return {
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    quizzesToday: streakData.quizzesToday,
    quizGoal: DAILY_QUIZ_GOAL,
    dailyGoalComplete: isDayComplete(streakData.quizzesToday),
    progressPercentage: Math.min(100, (streakData.quizzesToday / DAILY_QUIZ_GOAL) * 100),
    lastActiveRoadmap: streakData.lastActiveRoadmap,
    missedYesterday,
    recordQuizAttempt,
    recordRoadmapUnitComplete,
    updateLastActiveRoadmap,
    getWeeklyStreak,
  };
}
