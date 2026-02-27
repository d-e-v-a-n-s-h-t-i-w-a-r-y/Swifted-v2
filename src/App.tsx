import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import HomePage from "./pages/HomePage";
import StreaksPage from "./pages/StreaksPage";
import DailyPage from "./pages/DailyPage";
import DailyLongReadPage from "./pages/DailyLongReadPage";
import DailyQuizPage from "./pages/DailyQuizPage";
import RoadmapsPage from "./pages/RoadmapsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import StartupPage from "./pages/StartupPage";
import NamePrompt from "./components/auth/NamePrompt";

const queryClient = new QueryClient();

const STARTUP_SHOWN_KEY = "swifted-startup-shown";

function AppInner() {
  const { needsName, isAuthenticated } = useAuth();
  const [showStartup, setShowStartup] = useState(() => {
    return !localStorage.getItem(STARTUP_SHOWN_KEY);
  });

  const handleStart = () => {
    localStorage.setItem(STARTUP_SHOWN_KEY, "true");
    setShowStartup(false);
  };

  // Reset startup page when user logs out
  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem(STARTUP_SHOWN_KEY)) {
      setShowStartup(true);
    }
  }, [isAuthenticated]);

  // Show startup for unauthenticated + never seen
  if (showStartup && !isAuthenticated) {
    return <StartupPage onStart={handleStart} />;
  }

  // Show name prompt after first Google login
  if (needsName) {
    return <NamePrompt />;
  }

  // If startup was skipped but user later logged in, dismiss startup
  if (showStartup && isAuthenticated) {
    localStorage.setItem(STARTUP_SHOWN_KEY, "true");
    setShowStartup(false);
  }

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/streaks" element={<StreaksPage />} />
            <Route path="/daily" element={<DailyPage />} />
            <Route path="/daily/longread" element={<DailyLongReadPage />} />
            <Route path="/daily/quiz" element={<DailyQuizPage />} />
            <Route path="/roadmaps" element={<RoadmapsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <AppInner />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
