import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface StartupPageProps {
  onStart: () => void;
}

export default function StartupPage({ onStart }: StartupPageProps) {
  const { loginWithGoogle, isLoading } = useAuth();

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
    onStart();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-8 max-w-md w-full">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-transparent flex items-center justify-center">
            <img src="/logo.jpeg" alt="SwiftEd Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            SwiftEd – Learn Skills Faster with Micro-Learning
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-muted-foreground leading-relaxed">
            Turn Doomscrolling into Learning Bits
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            size="lg"
            className="w-full py-6 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all bg-foreground text-background hover:bg-foreground/90"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isLoading ? "Signing in…" : "Continue with Google"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/70 pt-2">
          Sign in to sync your progress across devices
        </p>

        {/* SEO Semantic Sections */}
        <div className="mt-10 text-left space-y-6 w-full max-w-md mx-auto opacity-90">
          <section>
            <h2 className="text-lg font-semibold text-foreground">The Best Micro Learning Platform</h2>
            <p className="text-sm text-muted-foreground mt-1">Join SwiftEd to ditch long, tedious lectures. Enjoy short structured courses designed to help you absorb knowledge in just minutes.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Learn Faster Every Day</h2>
            <p className="text-sm text-muted-foreground mt-1">Whether on a commute or a coffee break, our bite-sized approach helps you learn faster and retain technical skills without the burnout.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
