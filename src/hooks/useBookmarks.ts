import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBookmarks, toggleBookmark as supabaseToggleBookmark } from "@/services/supabaseService";

export interface BookmarkedSnippet {
  id: string;
  topic: string;
  title: string;
  image: string;
  content: string;
  example: string;
  savedAt: string;
}

const STORAGE_KEY = "swifted-bookmarks";

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedSnippet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load bookmarks (Remote if logged in, Local if not)
  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          // Fetch from Supabase
          const remoteBookmarks = await getUserBookmarks(user.id);
          // Convert database format to our app format
          const formatted = remoteBookmarks.map(b => ({
            id: `${b.snippet?.topic}-${b.snippet?.title}`.toLowerCase().replace(/\s+/g, "-"),
            topic: b.snippet?.topic || '',
            title: b.snippet?.title || '',
            image: b.snippet?.image_url || '',
            content: b.snippet?.content || '',
            example: b.snippet?.example || '',
            savedAt: b.created_at,
            _db_snippet_id: b.snippet_id // keep track of the db ID for toggling
          }));
          setBookmarks(formatted);
          setIsLoaded(true);
          return;
        } catch (e) {
          console.error("Failed to load remote bookmarks", e);
        }
      }

      // Fallback: local storage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setBookmarks(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse bookmarks", e);
        }
      }
      setIsLoaded(true);
    }

    loadData();
  }, [user]);

  // Save bookmarks to localStorage whenever they change (as a backup/local state)
  const saveBookmarksToLocal = useCallback((newBookmarks: BookmarkedSnippet[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
    setBookmarks(newBookmarks);
  }, []);

  const toggleBookmark = useCallback(async (snippet: Omit<BookmarkedSnippet, "id" | "savedAt"> & { db_id?: string }) => {
    const id = `${snippet.topic}-${snippet.title}`.toLowerCase().replace(/\s+/g, "-");
    const exists = bookmarks.some((b) => b.id === id);

    // Optimistic UI update
    if (exists) {
      setBookmarks(prev => prev.filter(b => b.id !== id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks.filter(b => b.id !== id)));
    } else {
      const newBookmark: BookmarkedSnippet = {
        ...snippet,
        id,
        savedAt: new Date().toISOString(),
      };
      setBookmarks(prev => [newBookmark, ...prev]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newBookmark, ...bookmarks]));
    }

    // Sync to remote if logged in
    if (user && snippet.db_id) {
      try {
        await supabaseToggleBookmark(user.id, snippet.db_id);
      } catch (e) {
        console.error("Failed to sync bookmark to Supabase", e);
        // We could revert optimistic update here on failure
      }
    }
  }, [bookmarks, user]);

  const addBookmark = useCallback((snippet: Omit<BookmarkedSnippet, "id" | "savedAt">) => {
    // Legacy func, prefer toggleBookmark
    toggleBookmark(snippet);
  }, [toggleBookmark]);

  const removeBookmark = useCallback((id: string) => {
    // Reverted for optimistic cache syncing — just use toggleBookmark in components
    const piece = bookmarks.find(b => b.id === id);
    if (piece) toggleBookmark(piece);
  }, [bookmarks, toggleBookmark]);

  const isBookmarked = useCallback((topic: string, title: string) => {
    const id = `${topic}-${title}`.toLowerCase().replace(/\s+/g, "-");
    return bookmarks.some((b) => b.id === id);
  }, [bookmarks]);

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,
  };
}
