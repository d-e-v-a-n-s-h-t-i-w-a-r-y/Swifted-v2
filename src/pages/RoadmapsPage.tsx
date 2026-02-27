import React, { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Beaker, Cpu, DollarSign, MessageCircle, Heart, Lightbulb, ChevronRight, ChevronLeft, Search, BookOpen, Loader2, BookMarked, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { getRoadmaps, getSnippets } from "@/services/supabaseService";

// Fixed 6 categories — always shown
const CATEGORIES = [
  { id: "science", title: "Science & Nature", icon: Beaker, dbNames: ["Science & Nature", "Science", "Nature", "Biology", "Physics", "Chemistry", "Environment"] },
  { id: "tech", title: "Tech & AI", icon: Cpu, dbNames: ["Tech & AI", "Tech", "AI", "Technology", "Engineering", "Programming", "Computer Science"] },
  { id: "finance", title: "Money & Finance", icon: DollarSign, dbNames: ["Money & Finance", "Finance", "Money", "Economics", "Investing", "Business"] },
  { id: "communication", title: "Languages", icon: MessageCircle, dbNames: ["Languages", "Communication", "Language", "Writing", "Public Speaking", "Linguistics"] },
  { id: "health", title: "Health & Mind", icon: Heart, dbNames: ["Health & Mind", "Health", "Mind", "Psychology", "Mental Health", "Wellness", "Fitness", "Nutrition"] },
  { id: "life", title: "Life Skills", icon: Lightbulb, dbNames: ["Life Skills", "Life", "Skills", "Productivity", "Philosophy", "Critical Thinking", "Self Improvement"] },
];

function matchesCategory(value: string | undefined, dbNames: string[]) {
  if (!value) return false;
  const v = value.toLowerCase();
  return dbNames.some(n => v.includes(n.toLowerCase()) || n.toLowerCase().includes(v));
}

export default function RoadmapsPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<any | null>(null);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mainSearchQuery, setMainSearchQuery] = useState("");
  const [dbRoadmaps, setDbRoadmaps] = useState<any[]>([]);
  const [dbSnippets, setDbSnippets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getRoadmaps().catch(() => []),
      getSnippets().catch(() => []),
    ]).then(([roads, snips]) => {
      setDbRoadmaps(roads);
      setDbSnippets(snips);
    }).finally(() => setIsLoading(false));
  }, []);

  const selectedCategory = CATEGORIES.find(c => c.id === selectedCategoryId);

  const filteredCategoryData = useMemo(() => {
    if (!selectedCategory) return { roadmaps: [], snippets: [] };

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

    const snippets = dbSnippets
      .filter(s => matchesCategory(s.topic, selectedCategory.dbNames))
      .map(s => ({
        title: s.title,
        topic: s.topic,
        preview: s.content?.slice(0, 80) + '...',
      }));

    if (!searchQuery.trim()) return { roadmaps, snippets };
    const q = searchQuery.toLowerCase();
    return {
      roadmaps: roadmaps.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)),
      snippets: snippets.filter(s => s.title.toLowerCase().includes(q) || s.topic.toLowerCase().includes(q)),
    };
  }, [selectedCategory, searchQuery, dbRoadmaps, dbSnippets]);

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
    const quizQuestions: any[] = Array.isArray(lesson?.quiz) ? lesson.quiz : [];
    const hasPrev = selectedLessonIdx > 0;
    const hasNext = selectedLessonIdx < units.length - 1;

    const handleAnswer = (qIdx: number, optIdx: number) => {
      if (quizSubmitted) return;
      setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
    };

    const handleSubmitQuiz = () => setQuizSubmitted(true);

    const goToLesson = (idx: number) => {
      setSelectedLessonIdx(idx);
      setQuizAnswers({});
      setQuizSubmitted(false);
      window.scrollTo(0, 0);
    };

    return (
      <div className="px-5 pt-4 pb-8 animate-fade-in">
        <button
          onClick={() => { setSelectedLessonIdx(null); setQuizAnswers({}); setQuizSubmitted(false); }}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-5 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {selectedRoadmap.title}</span>
        </button>

        {/* Lesson progress bar */}
        <div className="flex items-center gap-2 mb-5">
          {units.map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors",
                i === selectedLessonIdx ? "bg-primary" : i < selectedLessonIdx ? "bg-primary/40" : "bg-secondary"
              )}
            />
          ))}
        </div>

        <header className="mb-6">
          <span className="text-xs font-medium text-primary">Lesson {selectedLessonIdx + 1} of {units.length}</span>
          <h2 className="text-xl font-semibold text-foreground tracking-tight mt-0.5">{lesson?.title || `Lesson ${selectedLessonIdx + 1}`}</h2>
        </header>

        {/* Lesson body */}
        {lesson?.body && (
          <div className="prose prose-sm max-w-none mb-8">
            {lesson.body.split('\n').map((paragraph: string, pIdx: number) => (
              paragraph.trim() ? <p key={pIdx} className="text-secondary-foreground leading-relaxed mb-3">{paragraph}</p> : null
            ))}
          </div>
        )}

        {/* Quiz section */}
        {quizQuestions.length > 0 && (
          <section className="mt-6 mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-4">Quick Quiz</h3>
            <div className="space-y-5">
              {quizQuestions.map((q: any, qIdx: number) => (
                <div key={qIdx} className="rounded-xl bg-secondary/20 p-4">
                  <p className="font-medium text-sm text-foreground mb-3">{q.text || q.question}</p>
                  <div className="space-y-2">
                    {(q.options || []).map((opt: string, oIdx: number) => {
                      const isSelected = quizAnswers[qIdx] === oIdx;
                      const isCorrect = oIdx === q.correctIndex;
                      let optClasses = "border rounded-lg p-3 text-sm cursor-pointer transition-all ";
                      if (quizSubmitted) {
                        if (isCorrect) optClasses += "border-green-500 bg-green-500/10 text-green-700";
                        else if (isSelected && !isCorrect) optClasses += "border-red-500 bg-red-500/10 text-red-700";
                        else optClasses += "border-border/50 text-muted-foreground";
                      } else {
                        optClasses += isSelected ? "border-primary bg-primary/10 text-foreground" : "border-border/50 hover:border-primary/40 text-foreground";
                      }
                      return (
                        <button key={oIdx} className={cn(optClasses, "w-full text-left flex items-center gap-2")} onClick={() => handleAnswer(qIdx, oIdx)}>
                          {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                          {quizSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && q.explanation && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{q.explanation}</p>
                  )}
                </div>
              ))}
            </div>
            {!quizSubmitted && Object.keys(quizAnswers).length > 0 && (
              <Button className="w-full mt-4" onClick={handleSubmitQuiz}>Check Answers</Button>
            )}
          </section>
        )}

        {/* Prev / Next navigation */}
        <div className="flex gap-3 mt-6">
          {hasPrev && (
            <Button variant="outline" className="flex-1 h-11" onClick={() => goToLesson(selectedLessonIdx - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
          )}
          {hasNext ? (
            <Button className="flex-1 h-11" onClick={() => goToLesson(selectedLessonIdx + 1)}>
              Next lesson <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="flex-1 h-11" onClick={() => { setSelectedLessonIdx(null); setQuizAnswers({}); setQuizSubmitted(false); }}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Finish Course
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
          {selectedRoadmap.description && (
            <p className="text-muted-foreground text-sm mt-1">{selectedRoadmap.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">{units.length} lesson{units.length !== 1 ? "s" : ""}</p>
        </header>

        {units.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No lessons added yet.</p>
        ) : (
          <div className="space-y-3">
            {units.map((unit, idx) => (
              <Card
                key={unit.id || idx}
                className="border-0 bg-secondary/20 hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={() => { setSelectedLessonIdx(idx); setQuizAnswers({}); setQuizSubmitted(false); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-snug">{unit.title || `Lesson ${idx + 1}`}</h3>
                      {unit.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{unit.body.slice(0, 80)}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {units.length > 0 && (
          <div className="mt-6">
            <Button className="w-full h-11 font-semibold" onClick={() => { setSelectedLessonIdx(0); setQuizAnswers({}); setQuizSubmitted(false); }}>Start Learning</Button>
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
            {filteredCategoryData.roadmaps.length} course{filteredCategoryData.roadmaps.length !== 1 ? 's' : ''} · {filteredCategoryData.snippets.length} snippet{filteredCategoryData.snippets.length !== 1 ? 's' : ''}
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
                const progress = 0;
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

        {/* Quick Reads (snippets) */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Quick Reads</h2>
          <div className="space-y-2">
            {filteredCategoryData.snippets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No snippets in this category yet</p>
            ) : (
              filteredCategoryData.snippets.map((snippet, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-primary/80 font-medium">{snippet.topic}</span>
                    <h4 className="font-semibold text-foreground text-sm leading-snug">{snippet.title}</h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </div>
              ))
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
              const snippetCount = dbSnippets.filter(s => matchesCategory(s.topic, category.dbNames)).length;
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
                    {courseCount} course{courseCount !== 1 ? 's' : ''} · {snippetCount} snippet{snippetCount !== 1 ? 's' : ''}
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
