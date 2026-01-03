import { EventCard, EventCardSkeleton, type IntelEvent } from "@/components/event-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, Zap } from "lucide-react";

// Mock data for demonstration - replace with actual API call
const mockEvents: IntelEvent[] = [
    {
        id: "1",
        title: "Major Military Escalation Reported in Eastern Europe",
        alert: "Critical development: Multiple sources confirm significant troop movements.",
        summary: [
            "Satellite imagery shows substantial military buildup along border regions",
            "NATO emergency meeting scheduled for tomorrow morning",
            "Markets expected to react at open"
        ],
        category: "War",
        severity: 92,
        confidence: 0.89,
        market_impact: "high",
        entities: ["NATO", "EU", "$SPY", "Defense"],
        published_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    },
    {
        id: "2",
        title: "Federal Reserve Signals Emergency Rate Decision",
        alert: "Unscheduled Fed announcement expected within hours.",
        summary: [
            "Multiple Fed governors called to Washington",
            "Bond yields spiking across the curve",
            "Dollar strengthening against major pairs"
        ],
        category: "Market",
        severity: 85,
        confidence: 0.76,
        market_impact: "high",
        entities: ["$USD", "Fed", "Treasury", "Bonds"],
        published_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    },
    {
        id: "3",
        title: "Bitcoin ETF Sees Record Daily Inflows",
        alert: "Institutional buying accelerates significantly.",
        summary: [
            "$1.2B net inflows recorded in single session",
            "BlackRock IBIT leads with $800M",
            "BTC price consolidating above $95k"
        ],
        category: "Crypto",
        severity: 68,
        confidence: 0.94,
        market_impact: "medium",
        entities: ["$BTC", "BlackRock", "IBIT", "Fidelity"],
        published_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    },
    {
        id: "4",
        title: "Magnitude 7.2 Earthquake Strikes Pacific Region",
        alert: "Tsunami warning issued for coastal areas.",
        summary: [
            "Epicenter located 80km offshore",
            "No immediate reports of casualties",
            "Infrastructure damage assessment underway"
        ],
        category: "Disaster",
        severity: 75,
        confidence: 0.98,
        market_impact: "low",
        entities: ["Pacific", "USGS", "Insurance"],
        published_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    },
    {
        id: "5",
        title: "EU Announces New Tech Regulation Framework",
        alert: "Sweeping AI governance rules to take effect Q2.",
        summary: [
            "Mandatory AI audits for high-risk applications",
            "Significant fines for non-compliance",
            "Tech stocks mixed on the news"
        ],
        category: "Policy",
        severity: 55,
        confidence: 0.91,
        market_impact: "medium",
        entities: ["EU", "AI", "$GOOGL", "$MSFT", "$META"],
        published_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    },
];

// Category filter options
const categories = ["All", "War", "Market", "Disaster", "Tech", "Policy", "Crypto", "Energy"];

export default function FeedPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold tracking-tight">
                            <Zap className="inline-block h-5 w-5 text-primary mr-1" />
                            Intel Feed
                        </h1>
                        <Badge variant="outline" className="text-xs">
                            LIVE
                            <span className="ml-1 h-2 w-2 rounded-full bg-green-500 animate-pulse inline-block" />
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-1" />
                            Filter
                        </Button>
                        <Button variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Category filters */}
            <div className="border-b bg-muted/30">
                <div className="container py-2">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {categories.map((cat) => (
                            <Button
                                key={cat}
                                variant={cat === "All" ? "default" : "ghost"}
                                size="sm"
                                className="shrink-0"
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feed */}
            <main className="container py-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {mockEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>

                {/* Load more */}
                <div className="flex justify-center mt-8">
                    <Button variant="outline">
                        Load More Events
                    </Button>
                </div>
            </main>
        </div>
    );
}
