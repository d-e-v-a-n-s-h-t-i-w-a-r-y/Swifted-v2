import React, { useState, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Beaker, Cpu, DollarSign, Globe, Heart, Lightbulb, ChevronRight, ChevronLeft, Search, Loader2, BookMarked, CheckCircle2, XCircle, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { getRoadmaps } from "@/services/supabaseService";
import QuizModal from "@/components/learning/QuizModal";
import { useAuth } from "@/contexts/AuthContext";

// Fixed 6 categories — always shown
const CATEGORIES = [
  { id: "science", title: "Science & Nature", icon: Beaker, dbNames: ["Science & Nature", "Science", "Nature", "Biology", "Physics", "Chemistry", "Environment"] },
  { id: "tech", title: "Tech & AI", icon: Cpu, dbNames: ["Tech & AI", "Tech", "AI", "Technology", "Engineering", "Programming", "Computer Science"] },
  { id: "finance", title: "Money & Finance", icon: DollarSign, dbNames: ["Money & Finance", "Finance", "Money", "Economics", "Investing", "Business"] },
  { id: "communication", title: "World", icon: Globe, dbNames: ["World", "Languages", "Communication", "Language", "Writing", "Public Speaking", "Linguistics"] },
  { id: "health", title: "Health & Mind", icon: Heart, dbNames: ["Health & Mind", "Health", "Mind", "Psychology", "Mental Health", "Wellness", "Fitness", "Nutrition"] },
  { id: "life", title: "Life Skills", icon: Lightbulb, dbNames: ["Life Skills", "Life", "Skills", "Productivity", "Philosophy", "Critical Thinking", "Self Improvement"] },
];

function matchesCategory(value: string | undefined, dbNames: string[]) {
  if (!value) return false;
  const v = value.toLowerCase();
  return dbNames.some(n => v.includes(n.toLowerCase()) || n.toLowerCase().includes(v));
}

export default function RoadmapsPage() {
  const { user } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<any | null>(null);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [completedLessons, setCompletedLessonsRaw] = useState<Set<number>>(new Set());

  // Persist completed lessons to localStorage per user + roadmap
  const getStorageKey = (roadmapId: string) => `swifted_roadmap_progress_${user?.id || 'guest'}_${roadmapId}`;

  const setCompletedLessons = (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    setCompletedLessonsRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (selectedRoadmap?.id) {
        localStorage.setItem(getStorageKey(selectedRoadmap.id), JSON.stringify([...next]));
      }
      return next;
    });
  };

  // Load progress when selecting a roadmap
  useEffect(() => {
    if (selectedRoadmap?.id) {
      try {
        const saved = localStorage.getItem(getStorageKey(selectedRoadmap.id));
        if (saved) {
          setCompletedLessonsRaw(new Set(JSON.parse(saved)));
        } else {
          setCompletedLessonsRaw(new Set());
        }
      } catch {
        setCompletedLessonsRaw(new Set());
      }
    }
  }, [selectedRoadmap?.id, user?.id]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mainSearchQuery, setMainSearchQuery] = useState("");
  const [dbRoadmaps, setDbRoadmaps] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRoadmaps().catch(() => []).then((roads) => {
      setDbRoadmaps(roads);
    }).finally(() => setIsLoading(false));
  }, []);

  const selectedCategory = CATEGORIES.find(c => c.id === selectedCategoryId);

  const filteredCategoryData = useMemo(() => {
    if (!selectedCategory) return { roadmaps: [] };

    const roadmaps = dbRoadmaps
      .filter(r => matchesCategory(r.category, selectedCategory.dbNames))
      .map(r => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        category: r.category,
        cover_image: r.cover_image,
        units: Array.isArray(r.units) ? r.units : [],
        completedLessons: 0,
      }));

    if (!searchQuery.trim()) return { roadmaps };
    const q = searchQuery.toLowerCase();
    return {
      roadmaps: roadmaps.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)),
    };
  }, [selectedCategory, searchQuery, dbRoadmaps]);

  const filteredCategories = useMemo(() => {
    if (!mainSearchQuery.trim()) return CATEGORIES;
    const q = mainSearchQuery.toLowerCase();
    return CATEGORIES.filter(c => c.title.toLowerCase().includes(q));
  }, [mainSearchQuery]);



  if (isLoading) {
    return (
      <div className="h-[calc(100svh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Lesson reader view ───────────────────────────────────────────
  if (selectedRoadmap && selectedLessonIdx !== null) {
    const units: any[] = [...selectedRoadmap.units].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const lesson = units[selectedLessonIdx];
    const quizQuestions: any[] = Array.isArray(lesson?.quiz?.questions) ? lesson.quiz.questions : (Array.isArray(lesson?.quiz) ? lesson.quiz : []);
    const hasQuiz = quizQuestions.length > 0;
    const isLessonCompleted = completedLessons.has(selectedLessonIdx);
    const hasPrev = selectedLessonIdx > 0;
    const hasNext = selectedLessonIdx < units.length - 1;
    const canProceed = isLessonCompleted;

    const handleMarkAsRead = () => {
      setCompletedLessons(prev => new Set(prev).add(selectedLessonIdx));
    };

    const handleAnswer = (qIdx: number, optIdx: number) => {
      if (quizSubmitted) return;
      setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
    };

    const handleSubmitQuiz = () => {
      setQuizSubmitted(true);
      setCompletedLessons(prev => new Set(prev).add(selectedLessonIdx));
    };

    const goToLesson = (idx: number) => {
      setSelectedLessonIdx(idx);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setShowQuiz(false);
      window.scrollTo(0, 0);
    };

    return (
      <div className="px-5 pt-4 pb-8 animate-fade-in">
        <button
          onClick={() => { setSelectedLessonIdx(null); setQuizAnswers({}); setQuizSubmitted(false); setShowQuiz(false); }}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-5 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {selectedRoadmap.title}</span>
        </button>

        {/* Lesson progress */}
        <div className="flex items-center justify-between mb-5 text-xs text-muted-foreground">
          <span>{completedLessons.size} of {units.length} lessons completed</span>
          <span className="font-medium text-primary">Lesson {selectedLessonIdx + 1}</span>
        </div>

        <header className="mb-6">
          <span className="text-xs font-medium text-primary">Lesson {selectedLessonIdx + 1} of {units.length}</span>
          <h2 className="text-xl font-semibold text-foreground tracking-tight mt-0.5">{lesson?.title || `Lesson ${selectedLessonIdx + 1}`}</h2>
        </header>

        {/* Lesson body */}
        {lesson?.body && (
          <div className="prose prose-sm prose-invert max-w-none mb-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_p]:text-secondary-foreground [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-secondary-foreground [&_strong]:text-foreground [&_code]:bg-primary/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-primary [&_code]:text-xs [&_pre]:bg-secondary/30 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0">
            <ReactMarkdown>{lesson.body}</ReactMarkdown>
          </div>
        )}

        {/* Quiz Modal — fullscreen one-question-at-a-time */}
        {hasQuiz && showQuiz && (
          <QuizModal
            questions={quizQuestions.map(q => ({
              question: q.text || q.question,
              options: q.options || [],
              correctIndex: q.correctIndex ?? 0,
              explanation: q.explanation || '',
            }))}
            snippetTitle={lesson?.title || `Lesson ${selectedLessonIdx + 1}`}
            onComplete={() => {
              setCompletedLessons(prev => new Set(prev).add(selectedLessonIdx));
            }}
            onClose={() => {
              setShowQuiz(false);
            }}
            onReturnToSnippet={() => {
              setShowQuiz(false);
            }}
            onNextSnippet={() => {
              if (hasNext) {
                goToLesson(selectedLessonIdx + 1);
              } else {
                setSelectedLessonIdx(null);
                setShowQuiz(false);
              }
            }}
            hasNextSnippet={hasNext}
          />
        )}

        {/* 3-button navigation: Previous | Attempt Quiz | Next */}
        <div className="flex gap-2 mt-8">
          {/* Previous */}
          <Button
            variant="outline"
            className="flex-1 h-12"
            disabled={!hasPrev}
            onClick={() => hasPrev && goToLesson(selectedLessonIdx - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>

          {/* Attempt Quiz */}
          <Button
            className={cn("flex-1 h-12 font-semibold", isLessonCompleted && "bg-green-600 hover:bg-green-700")}
            onClick={() => {
              setShowQuiz(true);
              setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
            }}
          >
            {isLessonCompleted ? (
              <><CheckCircle2 className="w-4 h-4 mr-1" /> Retake Quiz</>
            ) : (
              <>Quiz</>
            )}
          </Button>

          {/* Next */}
          {hasNext ? (
            <Button
              className="flex-1 h-12"
              disabled={!canProceed}
              onClick={() => canProceed && goToLesson(selectedLessonIdx + 1)}
            >
              {canProceed ? (
                <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
              ) : (
                <>Next <Lock className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          ) : (
            <Button
              className="flex-1 h-12"
              disabled={!canProceed}
              onClick={() => {
                if (canProceed) {
                  setSelectedLessonIdx(null);
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                  setShowQuiz(false);
                }
              }}
            >
              {canProceed ? (
                <><CheckCircle2 className="w-4 h-4 mr-1" /> Finish</>
              ) : (
                <><Lock className="w-4 h-4 mr-1" /> Finish</>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Roadmap detail view ──────────────────────────────────────────
  if (selectedRoadmap) {
    const units: any[] = [...selectedRoadmap.units].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
      <div className="px-5 pt-4 pb-8 animate-fade-in">
        <button
          onClick={() => setSelectedRoadmap(null)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-5 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {selectedCategory?.title}</span>
        </button>

        {selectedRoadmap.cover_image && (
          <div className="w-full h-36 rounded-2xl overflow-hidden mb-5">
            <img src={selectedRoadmap.cover_image} alt={selectedRoadmap.title} className="w-full h-full object-cover" />
          </div>
        )}

        <header className="mb-6">
          <span className="text-xs font-medium text-primary">{selectedRoadmap.category}</span>
          <h2 className="text-xl font-semibold text-foreground tracking-tight mt-0.5">{selectedRoadmap.title}</h2>
          {selectedRoadmap.description && !selectedRoadmap.description.includes('JSON') && !selectedRoadmap.description.includes('Generate ') && (
            <p className="text-muted-foreground text-sm mt-1">
              {selectedRoadmap.description.length > 200
                ? selectedRoadmap.description.slice(0, 200) + '…'
                : selectedRoadmap.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">{units.length} lesson{units.length !== 1 ? "s" : ""}</p>
        </header>

        {units.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No lessons added yet.</p>
        ) : (
          <div className="space-y-3">
            {units.map((unit, idx) => {
              const isUnlocked = idx === 0 || completedLessons.has(idx - 1);
              const isDone = completedLessons.has(idx);
              return (
                <Card
                  key={unit.id || idx}
                  className={cn(
                    "border-0 transition-colors",
                    isUnlocked
                      ? "bg-secondary/20 hover:bg-secondary/30 cursor-pointer"
                      : "bg-secondary/10 opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (!isUnlocked) return;
                    setSelectedLessonIdx(idx);
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                        isDone ? "bg-green-500/20 text-green-500" : isUnlocked ? "bg-primary/10 text-primary" : "bg-secondary/30 text-muted-foreground"
                      )}>
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : isUnlocked ? idx + 1 : <Lock className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn("font-semibold text-sm leading-snug", isUnlocked ? "text-foreground" : "text-muted-foreground")}>{unit.title || `Lesson ${idx + 1}`}</h3>
                        {unit.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{unit.body.slice(0, 80)}</p>
                        )}
                      </div>
                      {isUnlocked ? (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {units.length > 0 && (
          <div className="mt-6">
            <Button className="w-full h-11 font-semibold" onClick={() => {
              // Find the first uncompleted lesson
              const nextIdx = units.findIndex((_, i) => !completedLessons.has(i));
              setSelectedLessonIdx(nextIdx >= 0 ? nextIdx : 0);
              setQuizAnswers({});
              setQuizSubmitted(false);
            }}>{completedLessons.size > 0 ? 'Continue Learning' : 'Start Learning'}</Button>
          </div>
        )}
      </div>
    );
  }

  // ── Category detail view ─────────────────────────────────────────
  if (selectedCategoryId && selectedCategory) {
    const Icon = selectedCategory.icon;

    return (
      <div className="px-5 pt-4 pb-8 animate-fade-in">
        <button
          onClick={() => { setSelectedCategoryId(null); setSearchQuery(""); }}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground tracking-tight">{selectedCategory.title}</h2>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            {filteredCategoryData.roadmaps.length} course{filteredCategoryData.roadmaps.length !== 1 ? 's' : ''}
          </p>
        </header>

        <div className="relative mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-secondary/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Courses */}
        <section className="mb-10">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Courses</h2>
          <div className="space-y-3">
            {filteredCategoryData.roadmaps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No courses in this category yet</p>
            ) : (
              filteredCategoryData.roadmaps.map((roadmap) => {
                const lessonsCount = roadmap.units.length;
                const progress = lessonsCount > 0 ? (completedLessons.size / lessonsCount) * 100 : 0;
                return (
                  <Card
                    key={roadmap.id}
                    className="border-0 bg-secondary/20 hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedRoadmap(roadmap)}
                  >
                    <CardContent className="p-4">
                      {roadmap.cover_image && (
                        <div className="w-full h-24 rounded-xl overflow-hidden mb-3">
                          <img src={roadmap.cover_image} alt={roadmap.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-[15px] leading-snug">{roadmap.title}</h3>
                          {roadmap.description && (
                            <p className="text-muted-foreground text-sm font-medium mt-1 line-clamp-1">{roadmap.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{lessonsCount} lesson{lessonsCount !== 1 ? 's' : ''}</p>
                          <div className="mt-3 flex items-center gap-3">
                            <Progress value={progress} className="h-1 flex-1" />
                            <span className="text-xs text-muted-foreground shrink-0">{Math.round(progress)}%</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="shrink-0 h-8 px-4 text-xs font-medium"
                          onClick={(e) => { e.stopPropagation(); setSelectedRoadmap(roadmap); }}
                        >
                          Start
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>


      </div>
    );
  }

  // ── Main view: 6 category grid ───────────────────────────────────
  return (
    <div className="px-5 pt-6 pb-8 animate-fade-in">
      <GlobalHeader />

      <header className="mb-6">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Learn</h2>
        <p className="text-muted-foreground text-sm font-medium mt-0.5">Pick a path that excites you</p>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <Input
          type="text"
          placeholder="Search topics..."
          value={mainSearchQuery}
          onChange={(e) => setMainSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-secondary/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 placeholder:text-muted-foreground/50"
        />
      </div>

      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Browse Topics</h2>

        {filteredCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No topics match your search</p>
        ) : (
          <div id="roadmap-categories" className="grid grid-cols-2 gap-3">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              const courseCount = dbRoadmaps.filter(r => matchesCategory(r.category, category.dbNames)).length;

              return (
                <button
                  key={category.id}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-xl text-left",
                    "bg-secondary/20 hover:bg-secondary/35 transition-all duration-200",
                    "active:scale-[0.98] group"
                  )}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">
                    {category.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    {courseCount} course{courseCount !== 1 ? 's' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
