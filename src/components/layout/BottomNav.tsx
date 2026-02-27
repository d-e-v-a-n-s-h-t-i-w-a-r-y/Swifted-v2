import { useState, useEffect } from "react";
import { Home, Flame, Calendar, Map, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Flame, label: "Streaks", path: "/streaks" },
  { icon: Calendar, label: "Daily", path: "/daily" },
  { icon: Map, label: "Roadmaps", path: "/roadmaps" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();
  const [showDailyBadge, setShowDailyBadge] = useState(false);

  useEffect(() => {
    const checkDailyBadge = () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const lastVisited = localStorage.getItem("swifted-daily-visited");
      setShowDailyBadge(lastVisited !== today);
    };

    checkDailyBadge();

    // Listen for daily page visits
    const handleDailyVisit = () => {
      setShowDailyBadge(false);
    };

    window.addEventListener("dailyVisited", handleDailyVisit);
    return () => window.removeEventListener("dailyVisited", handleDailyVisit);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto pb-safe">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const showBadge = path === "/daily" && showDailyBadge && !isActive;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "relative flex flex-col items-center gap-1 px-4 py-2 transition-colors duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-all duration-200"
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
