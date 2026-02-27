import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, HelpCircle, BookOpen, Clock, Bookmark, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, subDays, isToday } from "date-fns";
import { getDailyContent, DailyContent } from "@/services/supabaseService";

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [content, setContent] = useState<DailyContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    localStorage.setItem("swifted-daily-visited", today);
    window.dispatchEvent(new Event("dailyVisited"));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setContent(null);
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    getDailyContent(dateKey)
      .then(setContent)
      .catch(() => setContent({ date: dateKey }))
      .finally(() => setIsLoading(false));
  }, [selectedDate]);

  const goToPreviousDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const goToNextDay = () => {
    const next = addDays(selectedDate, 1);
    if (next <= new Date()) setSelectedDate(next);
  };
  const canGoNext = addDays(selectedDate, 1) <= new Date();

  const quizQuestions = content?.quiz?.questions || [];
  const vocabWords = content?.vocab || [];
  const longRead = content?.longRead;

  const hasContent = quizQuestions.length > 0 || vocabWords.length > 0 || longRead;


  return (
    <div className="min-h-[calc(100svh-4rem)] flex flex-col bg-background">
      {/* Date navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <button
          onClick={goToPreviousDay}
          className="p-2.5 rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronLeft size={20} className="text-muted-foreground" />
        </button>

        <div className="flex items-center gap-2.5">
          <Calendar size={16} className="text-primary" />
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE")}
            </p>
            <p className="text-xs text-muted-foreground">{format(selectedDate, "MMM d, yyyy")}</p>
          </div>
        </div>

        <button
          onClick={goToNextDay}
          disabled={!canGoNext}
          className={cn(
            "p-2.5 rounded-xl transition-colors",
            canGoNext ? "hover:bg-secondary" : "opacity-30 cursor-not-allowed"
          )}
        >
          <ChevronRight size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-5 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !hasContent ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Calendar size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No content for this date</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Add quiz, vocab, and long read content in the admin panel for this date.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Daily Quiz Card */}
            {quizQuestions.length > 0 && (
              <section className="rounded-2xl bg-card border border-border/50 p-5 animate-slide-up" style={{ animationDelay: "100ms" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Daily Quiz</h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={14} />
                    <span className="text-xs">{Math.ceil(quizQuestions.length * 0.5)} min</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {quizQuestions.length} question{quizQuestions.length !== 1 ? "s" : ""}
                </p>

                <Link
                  to={`/daily/quiz?date=${format(selectedDate, "yyyy-MM-dd")}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                >
                  <HelpCircle size={18} />
                  <span>Start Quiz</span>
                </Link>
              </section>
            )}

            {/* Daily Vocab Card */}
            {vocabWords.length > 0 && (
              <section className="rounded-2xl bg-card border border-border/50 p-5 animate-slide-up" style={{ animationDelay: "150ms" }}>
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Daily Vocab</h2>
                  <Bookmark size={18} className="text-muted-foreground" />
                </div>

                <div className="space-y-4">
                  {vocabWords.map((w, i) => (
                    <div key={w.id || i}>
                      <h3 className="text-base font-semibold text-primary mb-1">{w.word}</h3>
                      <p className="text-sm text-secondary-foreground mb-2 leading-relaxed">{w.meaning}</p>
                      {w.example && (
                        <div className="p-3 rounded-xl bg-secondary/50 border border-border/30">
                          <p className="text-xs text-muted-foreground italic">"{w.example}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Daily Long Read Card */}
            {longRead && (
              <section className="rounded-2xl bg-card border border-border/50 p-5 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground mb-2">
                      Long Read
                    </span>
                    <h2 className="text-lg font-semibold text-foreground">Daily Long Read</h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={14} />
                    <span className="text-xs">
                      {longRead.body ? `${Math.ceil(longRead.body.split(' ').length / 200)} min read` : "10 min read"}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-secondary-foreground mb-3">{longRead.title}</h3>
                {longRead.body && (
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                    {longRead.body.replace(/[#*_`]/g, '').slice(0, 200)}…
                  </p>
                )}

                <Link
                  to={`/daily/longread?date=${format(selectedDate, "yyyy-MM-dd")}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <BookOpen size={18} />
                  <span>Start Reading</span>
                </Link>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
