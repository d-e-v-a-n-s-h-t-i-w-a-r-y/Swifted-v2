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

// Remove static STORAGE_KEY constraint
export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedSnippet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load bookmarks (Remote if logged in, Local if not)
  useEffect(() => {
    async function loadData() {
      const userKey = `swifted-bookmarks-${user?.id || 'guest'}`;
      const guestKey = `swifted-bookmarks-guest`;
      const legacyKey = `swifted-bookmarks`;

      // Fallback: local storage
      let localData: BookmarkedSnippet[] = [];
      try {
        const saved = localStorage.getItem(userKey);
        if (saved) {
           localData = JSON.parse(saved);
        } else if (user) {
           // migrate guest/legacy to user
           const guestSaved = localStorage.getItem(guestKey) || localStorage.getItem(legacyKey);
           if (guestSaved) {
              localData = JSON.parse(guestSaved);
              localStorage.setItem(userKey, guestSaved);
              localStorage.removeItem(guestKey);
              localStorage.removeItem(legacyKey);
           }
        } else {
           // Guest: check legacy
           const legacySaved = localStorage.getItem(legacyKey);
           if (legacySaved) {
              localData = JSON.parse(legacySaved);
              localStorage.setItem(userKey, legacySaved);
           }
        }
        
        // If not logged in, just use local data. If logged in but remote failed, we also fallback to localData later (handled below if we setBookmarks)
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }

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
          
          // Merge local and remote
          const remoteIds = new Set(formatted.map(b => b.id));
          const uniqueLocal = localData.filter(b => !remoteIds.has(b.id));
          const merged = [...formatted, ...uniqueLocal];
          
          setBookmarks(merged);
          localStorage.setItem(userKey, JSON.stringify(merged));
          setIsLoaded(true);
          
          // Sync unique local back up (if they bookmarked offline or we migrated guest data)
          if (uniqueLocal.length > 0) {
             // Real app: batch sync these UP to Supabase.
             // For now we just keep them merged locally so they aren't lost. 
             // (Supabase sync on toggle will handle individual ones)
          }
          return;
        } catch (e) {
          console.error("Failed to load remote bookmarks", e);
        }
      }

      // Guest or remote failed
      setBookmarks(localData);
      setIsLoaded(true);
    }

    loadData();
  }, [user]);

  // Save bookmarks to localStorage whenever they change (as a backup/local state)
  const saveBookmarksToLocal = useCallback((newBookmarks: BookmarkedSnippet[]) => {
    const userKey = `swifted-bookmarks-${user?.id || 'guest'}`;
    localStorage.setItem(userKey, JSON.stringify(newBookmarks));
    setBookmarks(newBookmarks);
  }, [user]);

  const toggleBookmark = useCallback(async (snippet: Omit<BookmarkedSnippet, "id" | "savedAt"> & { db_id?: string }) => {
    const id = `${snippet.topic}-${snippet.title}`.toLowerCase().replace(/\s+/g, "-");
    const exists = bookmarks.some((b) => b.id === id);

    const userKey = `swifted-bookmarks-${user?.id || 'guest'}`;

    // Optimistic UI update
    if (exists) {
      setBookmarks(prev => prev.filter(b => b.id !== id));
      localStorage.setItem(userKey, JSON.stringify(bookmarks.filter(b => b.id !== id)));
    } else {
      const newBookmark: BookmarkedSnippet = {
        ...snippet,
        id,
        savedAt: new Date().toISOString(),
      };
      setBookmarks(prev => [newBookmark, ...prev]);
      localStorage.setItem(userKey, JSON.stringify([newBookmark, ...bookmarks]));
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
