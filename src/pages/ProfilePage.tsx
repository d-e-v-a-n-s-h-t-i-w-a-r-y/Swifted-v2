import { useState, useEffect } from "react";
import { Brain, CheckCircle2, Unlock, Clock, Flame, Calendar, LogOut, Bookmark, ChevronRight, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useBookmarks, BookmarkedSnippet } from "@/hooks/useBookmarks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useStreaks } from "@/hooks/useStreaks";
import { GlobalHeader } from "@/components/layout/GlobalHeader";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { currentStreak, longestStreak, quizzesToday, quizGoal, dailyGoalComplete, progressPercentage } = useStreaks();

  const [stats, setStats] = useState({
    conceptsLearned: 0,
    understandingVerified: 0,
    skillsUnlocked: 0,
    timeInvested: 0,
    clarityScore: 0,
    activeDays: 0,
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkedSnippet | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { bookmarks, removeBookmark } = useBookmarks();

  useEffect(() => {
    const savedStats = localStorage.getItem("swifted-stats");
    let parsedStats = { snippetsCompleted: 0, totalPoints: 0 };
    if (savedStats) parsedStats = JSON.parse(savedStats);

    const snippets = parsedStats.snippetsCompleted || 0;

    setStats({
      conceptsLearned: snippets * 3,
      understandingVerified: Math.floor(snippets * 0.8),
      skillsUnlocked: Math.floor(snippets / 5),
      timeInvested: snippets * 4,
      clarityScore: snippets > 0 ? Math.min(95, 60 + snippets * 2) : 0,
      activeDays: Math.min(snippets, 14),
    });
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const displayName = user?.name || "Learner";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const mainStats = [
    { label: "Concepts Learned", value: stats.conceptsLearned, icon: Brain, color: "text-primary", bgColor: "bg-primary/10" },
    { label: "Understanding Verified", value: stats.understandingVerified, icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10" },
    { label: "Skills Unlocked", value: stats.skillsUnlocked, icon: Unlock, color: "text-warning", bgColor: "bg-warning/10" },
    { label: "Time Invested", value: `${stats.timeInvested}m`, icon: Clock, color: "text-info", bgColor: "bg-info/10" },
  ];

  return (
    <div className="px-5 pt-6 pb-8 min-h-[calc(100svh-4rem)] flex flex-col animate-fade-in">
      {/* Global Header */}
      <GlobalHeader />

      {/* User Header */}
      <header className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          {user?.avatar ? (
            <img src={user.avatar} alt={displayName} className="w-14 h-14 rounded-2xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{displayInitial}</span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-foreground tracking-tight">{displayName}</h2>
            <p className="text-sm font-medium text-muted-foreground">
              {isAuthenticated ? user?.email : "Not signed in"}
            </p>
          </div>
        </div>
      </header>

      {/* Today's Progress Mini */}
      <div className="mb-4 rounded-2xl bg-card border border-border/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today's Progress</span>
          <span className={cn("text-xs font-medium", dailyGoalComplete ? "text-success" : "text-info")}>
            {quizzesToday}/{quizGoal} quizzes
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2.5" />
      </div>

      {/* Streak Card */}
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-warning/10 via-transparent to-rose/10 p-4 border border-warning/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-warning/15 flex items-center justify-center">
              <Flame className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold text-foreground">
                {currentStreak} {currentStreak === 1 ? "day" : "days"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Longest</p>
            <p className="text-lg font-semibold text-warning">{longestStreak} days</p>
          </div>
        </div>
      </div>

      {/* Saved Snippets Card */}
      <Card
        className="mb-4 cursor-pointer hover:bg-secondary/30 transition-all border-0 bg-secondary/20"
        onClick={() => setShowBookmarks(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose/15 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-rose" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Saved Snippets</p>
                <p className="text-sm font-medium text-muted-foreground">
                  {bookmarks.length} {bookmarks.length === 1 ? "snippet" : "snippets"} saved
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Learning Snapshot */}
      <section className="mb-6 flex-1">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Your Progress</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {mainStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-0 bg-secondary/20" style={{ animationDelay: `${index * 50}ms` }}>
                <CardContent className="p-4">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-2", stat.bgColor)}>
                    <Icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 bg-secondary/20">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{stats.clarityScore}%</p>
                <p className="text-xs font-medium text-muted-foreground">Clarity Score</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-secondary/20">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-info/15 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-info" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{stats.activeDays}</p>
                <p className="text-xs font-medium text-muted-foreground">Active Days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Settings */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Settings</h2>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-3.5 px-4 rounded-xl font-medium text-muted-foreground bg-secondary/50 border border-border transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-sm"
        >
          <LogOut size={18} />
          <span>{isAuthenticated ? "Log Out" : "Log Out"}</span>
        </button>
      </section>

      {/* Bookmarks Modal */}
      {showBookmarks && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Saved Snippets</h2>
              <button
                onClick={() => { setShowBookmarks(false); setSelectedBookmark(null); }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-5">
                {bookmarks.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No saved snippets yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Tap the bookmark icon on any snippet to save it here</p>
                  </div>
                ) : selectedBookmark ? (
                  <div className="animate-fade-in">
                    <button onClick={() => setSelectedBookmark(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <span>Back to list</span>
                    </button>
                    <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
                      <img src={selectedBookmark.image} alt={selectedBookmark.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold bg-background/80 text-primary">{selectedBookmark.topic}</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-4">{selectedBookmark.title}</h3>
                    <div className="space-y-3 mb-6">
                      {selectedBookmark.content.split('\n\n').map((p, i) => (
                        <p key={i} className="text-sm text-secondary-foreground leading-relaxed">{p}</p>
                      ))}
                    </div>
                    <div className="example-block mb-6">
                      <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">Example</p>
                      <p className="text-sm text-muted-foreground">{selectedBookmark.example}</p>
                    </div>
                    <button
                      onClick={() => { removeBookmark(selectedBookmark.id); setSelectedBookmark(null); }}
                      className="w-full py-3 rounded-xl font-medium text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors"
                    >
                      Remove from Saved
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookmarks.map((bookmark) => (
                      <Card key={bookmark.id} className="cursor-pointer border-0 bg-secondary/20 hover:bg-secondary/30 transition-colors" onClick={() => setSelectedBookmark(bookmark)}>
                        <CardContent className="p-4 flex gap-3">
                          <img src={bookmark.image} alt={bookmark.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-primary font-semibold">{bookmark.topic}</span>
                            <h4 className="font-semibold text-foreground truncate mt-0.5">{bookmark.title}</h4>
                            <p className="text-xs font-medium text-muted-foreground line-clamp-2 mt-1">{bookmark.content.slice(0, 100)}...</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Confirm Logout</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Do you want to logout?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-medium text-foreground bg-secondary border border-border hover:bg-secondary/80 transition-colors"
              >
                No
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 rounded-xl font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
