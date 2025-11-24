"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BloodRequestCard } from "@/components/feed/blood-request-card";
import { getFeedItems, getNewFeedItems, type FeedItem, type FeedFilters } from "@/server/actions/feed";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

type InfiniteFeedProps = {
  initialItems: FeedItem[];
  initialCursor: number | null;
  filters: FeedFilters;
};

export function InfiniteFeed({ initialItems, initialCursor, filters }: InfiniteFeedProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<number | null>(initialCursor);
  const [hasMore, setHasMore] = useState(!!initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [newItemsCount, setNewItemsCount] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const highestIdRef = useRef<number>(initialItems[0]?.id ?? 0);
  const isCheckingNewRef = useRef(false);

  // Load more items when scrolling
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !cursor) return;

    setIsLoading(true);
    try {
      const result = await getFeedItems(filters, cursor);
      
      // Merge new items
      setItems((prev) => {
        const existingIds = new Set(prev.map(item => item.id));
        const newUniqueItems = result.items.filter(item => !existingIds.has(item.id));
        return [...prev, ...newUniqueItems];
      });
      
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);

      // If there are new items in the database, update the count
      if (result.newItemsCount > 0) {
        setNewItemsCount((prev) => prev + result.newItemsCount);
      }
    } catch (error) {
      console.error("Failed to load more items:", error);
      toast.error("Failed to load more posts");
    } finally {
      setIsLoading(false);
    }
  }, [cursor, hasMore, isLoading, filters]);

  // Check for new posts periodically
  const checkForNewPosts = useCallback(async () => {
    if (isCheckingNewRef.current) return;
    
    isCheckingNewRef.current = true;
    try {
      const result = await getNewFeedItems(filters, highestIdRef.current);
      
      if (result.items.length > 0) {
        setNewItemsCount((prev) => prev + result.items.length);
        
        // Auto-insert new items at the top
        setItems((prev) => {
          const existingIds = new Set(prev.map(item => item.id));
          const newUniqueItems = result.items.filter(item => !existingIds.has(item.id));
          
          if (newUniqueItems.length > 0) {
            // Update highest ID
            const maxId = Math.max(...newUniqueItems.map(item => item.id));
            if (maxId > highestIdRef.current) {
              highestIdRef.current = maxId;
            }
            
            // Show notification
            toast.success(`${newUniqueItems.length} new ${newUniqueItems.length === 1 ? 'post' : 'posts'} added`, {
              duration: 3000,
              icon: "🩸",
            });
          }
          
          return [...newUniqueItems, ...prev];
        });
      }
    } catch (error) {
      console.error("Failed to check for new posts:", error);
    } finally {
      isCheckingNewRef.current = false;
    }
  }, [filters]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  // Check for new posts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewPosts();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [checkForNewPosts]);

  // Update highest ID when initial items change
  useEffect(() => {
    if (initialItems[0]?.id && initialItems[0].id > highestIdRef.current) {
      highestIdRef.current = initialItems[0].id;
    }
  }, [initialItems]);

  // Reset feed when filters or initial items/cursor change (e.g., user navigates with new query params)
  useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
    setHasMore(!!initialCursor);
    highestIdRef.current = initialItems[0]?.id ?? 0;
  }, [initialItems, initialCursor, filters]);

  return (
    <>
      {items.length === 0 && !isLoading ? (
        <div className="rounded-3xl border border-dashed border-[var(--color-border-primary)] bg-surface-primary-soft p-10 text-center">
          <h2 className="text-xl font-semibold text-primary">No requests match these filters yet</h2>
          <p className="mt-2 text-sm text-secondary">
            Try broadening your filters or create a new request for your community.
          </p>
        </div>
      ) : (
        <>
          {items.map((item) => (
            <BloodRequestCard key={item.id} request={item} />
          ))}
        </>
      )}

      {/* Loading indicator */}
      {hasMore && (
        <div ref={observerTarget} className="flex items-center justify-center py-8">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more posts...</span>
            </div>
          ) : (
            <div className="text-sm text-muted">Scroll to load more</div>
          )}
        </div>
      )}

      {/* End of feed message */}
      {!hasMore && items.length > 0 && (
        <div className="rounded-3xl border border-soft bg-surface-primary-soft p-6 text-center">
          <p className="text-sm text-secondary">You've reached the end of the feed</p>
          <p className="mt-1 text-xs text-muted">Check back later for new blood donation requests</p>
        </div>
      )}
    </>
  );
}
