import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDailyContent } from "@/services/supabaseService";

interface QuizQuestion {
    id?: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export default function DailyQuizPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getDailyContent(dateParam)
            .then((content) => {
                setQuestions(content?.quiz?.questions || []);
            })
            .catch(() => setQuestions([]))
            .finally(() => setIsLoading(false));
    }, [dateParam]);

    const goBack = () => navigate("/daily");

    const handleSelectOption = (optionIndex: number) => {
        if (isAnswered) return;
        setSelectedOption(optionIndex);
        setIsAnswered(true);
        if (optionIndex === questions[currentIndex].correctIndex) {
            setScore((prev) => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex + 1 >= questions.length) {
            setIsFinished(true);
        } else {
            setCurrentIndex((prev) => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setIsFinished(false);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-[calc(100svh-4rem)] flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // No questions found
    if (questions.length === 0) {
        return (
            <div className="min-h-[calc(100svh-4rem)] flex flex-col items-center justify-center bg-background px-5 text-center">
                <Trophy size={40} className="text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">No quiz found</h2>
                <p className="text-sm text-muted-foreground mb-6">There's no quiz available for this date.</p>
                <button
                    onClick={goBack}
                    className="px-6 py-3 rounded-xl font-semibold text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                >
                    Back to Daily
                </button>
            </div>
        );
    }

    // Results screen
    if (isFinished) {
        const percentage = Math.round((score / questions.length) * 100);
        const emoji = percentage === 100 ? "🎉" : percentage >= 70 ? "👏" : percentage >= 50 ? "👍" : "💪";
        const message =
            percentage === 100
                ? "Perfect score!"
                : percentage >= 70
                    ? "Great job!"
                    : percentage >= 50
                        ? "Not bad!"
                        : "Keep practicing!";

        return (
            <div className="min-h-[calc(100svh-4rem)] flex flex-col bg-background">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
                    <button onClick={goBack} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                        <ArrowLeft size={20} className="text-foreground" />
                    </button>
                    <p className="text-sm font-semibold text-foreground">Quiz Results</p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
                    <div className="text-5xl mb-4">{emoji}</div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">{message}</h2>
                    <p className="text-muted-foreground mb-6">
                        You scored <span className="font-semibold text-primary">{score}</span> out of{" "}
                        <span className="font-semibold">{questions.length}</span>
                    </p>

                    {/* Score ring */}
                    <div className="relative w-32 h-32 mb-8">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${percentage * 2.64} ${264 - percentage * 2.64}`}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-foreground">{percentage}%</span>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full max-w-xs">
                        <button
                            onClick={handleRestart}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                            <RotateCcw size={16} />
                            <span>Retry</span>
                        </button>
                        <button
                            onClick={goBack}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                        >
                            <span>Done</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Quiz question screen
    const question = questions[currentIndex];
    const progress = ((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100;

    return (
        <div className="min-h-[calc(100svh-4rem)] flex flex-col bg-background">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
                <button onClick={goBack} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                    <ArrowLeft size={20} className="text-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Daily Quiz</p>
                    <p className="text-xs text-muted-foreground">
                        Question {currentIndex + 1} of {questions.length}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary text-xs font-medium text-secondary-foreground">
                    {score}/{questions.length}
                </div>
            </div>

            {/* Progress bar */}
            <div className="px-4 pt-3">
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="flex-1 px-5 pt-6 pb-6 flex flex-col">
                <h2 className="text-lg font-semibold text-foreground mb-6 leading-relaxed">{question.text}</h2>

                {/* Options */}
                <div className="space-y-3 flex-1">
                    {question.options.map((option, idx) => {
                        const isSelected = selectedOption === idx;
                        const isCorrect = idx === question.correctIndex;

                        let optionStyle = "border-border/50 bg-card hover:bg-secondary/50";
                        if (isAnswered) {
                            if (isCorrect) {
                                optionStyle = "border-emerald-500/50 bg-emerald-500/10";
                            } else if (isSelected && !isCorrect) {
                                optionStyle = "border-red-500/50 bg-red-500/10";
                            } else {
                                optionStyle = "border-border/30 bg-card/50 opacity-60";
                            }
                        } else if (isSelected) {
                            optionStyle = "border-primary/50 bg-primary/10";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleSelectOption(idx)}
                                disabled={isAnswered}
                                className={cn(
                                    "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200",
                                    optionStyle
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                                        isAnswered && isCorrect
                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                            : isAnswered && isSelected && !isCorrect
                                                ? "border-red-500 bg-red-500 text-white"
                                                : "border-border text-muted-foreground"
                                    )}
                                >
                                    {isAnswered && isCorrect ? (
                                        <CheckCircle2 size={16} />
                                    ) : isAnswered && isSelected && !isCorrect ? (
                                        <XCircle size={16} />
                                    ) : (
                                        String.fromCharCode(65 + idx)
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-sm font-medium leading-relaxed",
                                        isAnswered && isCorrect
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : isAnswered && isSelected && !isCorrect
                                                ? "text-red-600 dark:text-red-400"
                                                : "text-foreground"
                                    )}
                                >
                                    {option}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Explanation + Next button */}
                {isAnswered && (
                    <div className="mt-4 animate-slide-up">
                        {question.explanation && (
                            <div className="p-4 rounded-xl bg-secondary/50 border border-border/30 mb-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Explanation</p>
                                <p className="text-sm text-secondary-foreground leading-relaxed">{question.explanation}</p>
                            </div>
                        )}
                        <button
                            onClick={handleNext}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                        >
                            <span>{currentIndex + 1 >= questions.length ? "See Results" : "Next Question"}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
