import Link from "next/link";
import { EventCard, type IntelEvent } from "@/components/event-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, Zap } from "lucide-react";
import { getEvents } from "@/lib/db";

// Category filter options
const categories = ["All", "War", "Market", "Disaster", "Tech", "Policy", "Crypto", "Energy"];

interface FeedPageProps {
  searchParams: {
    category?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const selectedCategory = searchParams.category || "All";
  
  // Fetch real events from database
  // If "All", pass undefined to getEvents to fetch everything
  const eventsData = await getEvents({ 
    category: selectedCategory === "All" ? undefined : selectedCategory,
    limit: 50 
  });

  // Transform DB events to UI events
  const events: IntelEvent[] = eventsData.map(e => ({
    id: e.id,
    title: e.title,
    alert: e.alert || undefined,
    summary: e.summary,
    category: e.category,
    severity: e.severity,
    confidence: Number(e.confidence), // ensure number
    market_impact: e.market_impact,
    entities: e.entities,
    published_at: e.published_at.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold tracking-tight">Intel Feed</span>
            </Link>
            <Badge variant="outline" className="text-xs gap-1">
              LIVE
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse inline-block" />
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/feed">
                <Filter className="h-4 w-4 mr-1" />
                Clear
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/feed?category=${selectedCategory}&t=${Date.now()}`}>
                <RefreshCw className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Category filters */}
      <div className="border-b bg-muted/30">
        <div className="container py-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Link 
                key={cat} 
                href={cat === "All" ? "/feed" : `/feed?category=${cat}`}
              >
                <Button
                  variant={cat === selectedCategory ? "default" : "ghost"}
                  size="sm"
                  className="shrink-0"
                >
                  {cat}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <main className="container py-6">
        {events.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No events found for this category.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Load more (placeholder for pagination) */}
        {events.length >= 50 && (
          <div className="flex justify-center mt-8">
            <Button variant="outline">
              Load More Events
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
