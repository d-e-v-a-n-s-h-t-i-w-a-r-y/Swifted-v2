import { useState } from "react";
import { CheckCircle, XCircle, Trophy, ArrowRight, ArrowLeft, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizModalProps {
  questions: Question[];
  snippetTitle: string;
  onComplete: (score: number) => void;
  onClose: () => void;
  onReturnToSnippet: () => void;
  onNextSnippet: () => void;
  hasNextSnippet: boolean;
}

export default function QuizModal({ 
  questions, 
  snippetTitle, 
  onComplete, 
  onClose, 
  onReturnToSnippet,
  onNextSnippet,
  hasNextSnippet 
}: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [attemptsOnCurrent, setAttemptsOnCurrent] = useState(0);

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    const correct = index === question.correctIndex;
    
    if (correct) {
      setIsAnswered(true);
      setIsCorrect(true);
      const points = attemptsOnCurrent === 0 ? 10 : attemptsOnCurrent === 1 ? 5 : 2;
      setScore(prev => prev + points);
    } else {
      setIsCorrect(false);
      setAttemptsOnCurrent(prev => prev + 1);
      // Show error briefly then reset for retry
      setTimeout(() => {
        setSelectedAnswer(null);
      }, 1000);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsCompleted(true);
      onComplete(score);
    } else {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setAttemptsOnCurrent(0);
    }
  };

  if (isCompleted) {
    const maxScore = questions.length * 10;
    const percentage = Math.round((score / maxScore) * 100);
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background animate-fade-in">
        <div className="w-full max-w-md mx-5 text-center">
          {/* Success Icon */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center">
              <Trophy size={40} className="text-primary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Snippet Completed</h2>
          <p className="text-muted-foreground mb-8">"{snippetTitle}"</p>

          {/* Score Display */}
          <div className="rounded-2xl bg-card border border-border/50 p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-2">Your Score</p>
            <p className="text-4xl font-bold text-primary mb-1">{score} pts</p>
            <p className="text-sm text-muted-foreground">{percentage}% accuracy</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {hasNextSnippet && (
              <button
                onClick={onNextSnippet}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
              >
                <span>Next Snippet</span>
                <ArrowRight size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <span>Return to Feed</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-fade-in">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onReturnToSnippet}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to reading</span>
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} 
          />
        </div>
      </div>

      {/* Question Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <h2 className="text-xl font-semibold text-foreground leading-relaxed mb-6">
          {question.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const showCorrect = isAnswered && idx === question.correctIndex;
            const showWrong = isSelected && !isAnswered && !isCorrect;
            
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={isAnswered}
                className={cn(
                  "w-full p-4 rounded-xl text-left font-medium transition-all duration-200 border-2",
                  showCorrect
                    ? "bg-green-500/15 border-green-500 text-foreground"
                    : showWrong
                    ? "bg-destructive/15 border-destructive text-foreground animate-shake"
                    : isAnswered
                    ? "bg-card/50 border-border/50 opacity-60"
                    : "bg-card border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showCorrect && (
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  )}
                  {showWrong && (
                    <XCircle size={20} className="text-destructive flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {isAnswered && (
          <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm font-semibold text-green-500">Correct!</span>
            </div>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}

        {selectedAnswer !== null && !isAnswered && (
          <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 animate-fade-in">
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-destructive" />
              <span className="text-sm font-semibold text-destructive">Try again!</span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions - Always Visible */}
      <div className="flex-shrink-0 px-5 py-5 bg-background border-t border-border/50">
        {isAnswered ? (
          <div className="space-y-3">
            <button 
              onClick={handleNext} 
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
            >
              <span>{isLastQuestion ? "Finish Quiz" : "Next Question"}</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={onReturnToSnippet}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen size={16} />
              <span>Return to snippet</span>
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Select an answer to continue
          </p>
        )}
      </div>
    </div>
  );
}
