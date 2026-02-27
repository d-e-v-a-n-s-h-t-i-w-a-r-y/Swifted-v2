import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, HelpCircle, Lightbulb, Bookmark, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import QuizModal from "@/components/learning/QuizModal";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { TextToSpeechControls } from "@/components/snippets/TextToSpeechControls";
import { useStreaks } from "@/hooks/useStreaks";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { getSnippets } from "@/services/supabaseService";

export default function HomePage() {
  const [snippets, setSnippets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showTTS, setShowTTS] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const tts = useTextToSpeech();
  const { recordQuizAttempt } = useStreaks();

  // Fetch snippets from Supabase
  useEffect(() => {
    getSnippets()
      .then((data) => {
        const mapped = data.map((s) => ({
          topic: s.topic,
          title: s.title,
          image: s.image_url || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=400&fit=crop',
          content: s.content,
          example: s.example || '',
          quiz: Array.isArray(s.quiz)
            ? s.quiz.map((q) => ({
              question: q.text,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
            }))
            : [],
        }));
        setSnippets(mapped);
      })
      .catch((err) => console.error('Failed to load snippets:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const snippet = snippets[currentIndex];
  const hasNextSnippet = currentIndex < snippets.length - 1;
  const isCurrentBookmarked = snippet ? isBookmarked(snippet.topic, snippet.title) : false;

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
    tts.stop();
    setShowTTS(false);
  }, [currentIndex]);

  const goToPrevious = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const goToNext = () => setCurrentIndex((prev) => Math.min(snippets.length - 1, prev + 1));

  const handleQuizComplete = (score: number) => {
    recordQuizAttempt("snippet");
    const savedStats = localStorage.getItem("swifted-stats");
    const stats = savedStats ? JSON.parse(savedStats) : { snippetsCompleted: 0, totalPoints: 0 };
    stats.snippetsCompleted += 1;
    stats.totalPoints += score;
    localStorage.setItem("swifted-stats", JSON.stringify(stats));
  };

  const handleQuizClose = () => setShowQuiz(false);
  const handleReturnToSnippet = () => setShowQuiz(false);

  const handleNextSnippet = () => {
    setShowQuiz(false);
    if (hasNextSnippet) setCurrentIndex(prev => prev + 1);
  };

  const handleBookmarkToggle = () => {
    toggleBookmark({
      topic: snippet.topic,
      title: snippet.title,
      image: snippet.image,
      content: snippet.content,
      example: snippet.example,
    });
  };

  const handleTTSToggle = () => {
    if (showTTS) { tts.stop(); setShowTTS(false); } else { setShowTTS(true); }
  };

  const handleTTSPlay = () => {
    const fullText = `${snippet.title}. ${snippet.content}`;
    tts.speak(fullText);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-[calc(100svh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state
  if (!snippet) {
    return (
      <div className="h-[calc(100svh-4rem)] flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Lightbulb className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">No snippets yet</h2>
        <p className="text-muted-foreground text-sm">
          Content will appear here once published in the admin panel.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="h-[calc(100svh-4rem)] flex flex-col bg-background">
        {/* Global Header */}
        <div className="px-4 sm:px-5 pt-4 pb-2">
          <GlobalHeader />
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <article className="animate-fade-in" key={currentIndex}>
            {/* Hero Image */}
            <div className="relative w-full" style={{ height: '35vh', minHeight: '200px', maxHeight: '280px' }}>
              <img src={snippet.image} alt={snippet.title} className="w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />

              <button
                onClick={handleBookmarkToggle}
                className={cn(
                  "absolute top-3 right-3 p-2.5 rounded-xl backdrop-blur-sm border transition-all",
                  isCurrentBookmarked
                    ? "bg-primary/90 border-primary text-primary-foreground"
                    : "bg-background/80 border-border text-muted-foreground hover:text-foreground"
                )}
                aria-label={isCurrentBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                <Bookmark size={20} strokeWidth={2.5} className={isCurrentBookmarked ? "fill-current" : ""} />
              </button>

              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-background/80 text-primary backdrop-blur-sm border border-border/50">
                  {snippet.topic}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-5 pt-4 pb-6">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground leading-tight mb-4 sm:mb-6">
                {snippet.title}
              </h1>

              <button
                onClick={handleTTSToggle}
                className={cn(
                  "mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  showTTS
                    ? "bg-primary/20 border border-primary/50 text-primary"
                    : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Volume2 size={18} />
                <span>{showTTS ? "Hide Reader" : "Listen to Snippet"}</span>
              </button>

              {showTTS && (
                <div className="mb-4 animate-fade-in">
                  <TextToSpeechControls
                    isPlaying={tts.isPlaying}
                    isPaused={tts.isPaused}
                    rate={tts.rate}
                    onPlay={handleTTSPlay}
                    onPause={tts.pause}
                    onResume={tts.resume}
                    onRateChange={tts.updateRate}
                  />
                </div>
              )}

              <div className="mb-5 sm:mb-6">
                {snippet.content.split('\n\n').map((paragraph: string, idx: number) => (
                  <p key={idx} className="text-sm sm:text-[15px] font-medium text-secondary-foreground leading-relaxed mb-3 sm:mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              <button
                className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors text-sm sm:text-base"
                onClick={() => setShowQuiz(true)}
              >
                <HelpCircle size={18} />
                <span>Take Quick Quiz</span>
              </button>
            </div>
          </article>
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-card/95 backdrop-blur-sm border-t border-border/50">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={cn(
              "flex items-center gap-1 sm:gap-2 text-sm font-semibold transition-all",
              currentIndex === 0 ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ChevronLeft size={18} />
            <span className="hidden xs:inline">Previous</span>
          </button>

          <div className="flex items-center gap-1">
            {snippets.map((_, idx) => (
              <div key={idx} className={cn("h-1.5 rounded-full transition-all", idx === currentIndex ? "bg-primary w-4 sm:w-5" : "bg-muted w-1.5")} />
            ))}
          </div>

          <button
            onClick={goToNext}
            disabled={currentIndex === snippets.length - 1}
            className={cn(
              "flex items-center gap-1 sm:gap-2 text-sm font-semibold transition-all",
              currentIndex === snippets.length - 1 ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {showQuiz && (
        <QuizModal
          questions={snippet.quiz}
          snippetTitle={snippet.title}
          onComplete={handleQuizComplete}
          onClose={handleQuizClose}
          onReturnToSnippet={handleReturnToSnippet}
          onNextSnippet={handleNextSnippet}
          hasNextSnippet={hasNextSnippet}
        />
      )}
    </>
  );
}
