import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

export default function NamePrompt() {
  const { setDisplayName } = useAuth();
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDisplayName(name.trim() || "Learner");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-8 max-w-sm w-full">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/15 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Welcome to Swifted</h1>
          <p className="text-muted-foreground">What should we call you?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-center text-lg h-12 rounded-xl"
            autoFocus
            maxLength={30}
          />
          <Button
            type="submit"
            size="lg"
            className="w-full py-6 rounded-full font-semibold"
          >
            Let's go
          </Button>
          <button
            type="button"
            onClick={() => setDisplayName("Learner")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
