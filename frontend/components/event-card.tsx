"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { 
  Swords, 
  TrendingUp, 
  CloudLightning, 
  Cpu, 
  Landmark, 
  Bitcoin, 
  Zap,
  Newspaper,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

// Event type matching database schema
export interface IntelEvent {
  id: string;
  title: string;
  alert?: string;
  summary: string[];
  category: "War" | "Market" | "Disaster" | "Tech" | "Policy" | "Crypto" | "Energy" | "Other";
  severity: number;
  confidence: number;
  market_impact: "none" | "low" | "medium" | "high";
  entities: string[];
  published_at: string;
  source_url?: string;
}

// Category icon mapping
const categoryIcons: Record<string, React.ElementType> = {
  War: Swords,
  Market: TrendingUp,
  Disaster: CloudLightning,
  Tech: Cpu,
  Policy: Landmark,
  Crypto: Bitcoin,
  Energy: Zap,
  Other: Newspaper,
};

// Severity color mapping
function getSeverityColor(severity: number): string {
  if (severity >= 80) return "bg-red-500/20 text-red-400 border-red-500/50";
  if (severity >= 60) return "bg-orange-500/20 text-orange-400 border-orange-500/50";
  if (severity >= 40) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
  return "bg-green-500/20 text-green-400 border-green-500/50";
}

// Market impact badge
function getImpactBadge(impact: string) {
  const colors: Record<string, string> = {
    high: "bg-red-500/20 text-red-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-blue-500/20 text-blue-400",
    none: "bg-gray-500/20 text-gray-400",
  };
  return colors[impact] || colors.none;
}

// Confidence indicator
function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  const Icon = confidence >= 0.8 ? CheckCircle : confidence >= 0.5 ? Clock : AlertTriangle;
  const color = confidence >= 0.8 ? "text-green-400" : confidence >= 0.5 ? "text-yellow-400" : "text-red-400";
  
  return (
    <div className={cn("flex items-center gap-1 text-xs", color)}>
      <Icon className="h-3 w-3" />
      <span>{percent}%</span>
    </div>
  );
}

export function EventCard({ event }: { event: IntelEvent }) {
  const CategoryIcon = categoryIcons[event.category] || Newspaper;
  const timeAgo = formatDistanceToNow(new Date(event.published_at), { addSuffix: true });

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
      "border-l-4",
      getSeverityColor(event.severity).replace("bg-", "border-l-").replace("/20", "")
    )}>
      {/* Severity indicator bar */}
      <div 
        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary to-primary/50"
        style={{ width: `${event.severity}%` }}
      />
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              getSeverityColor(event.severity)
            )}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <div>
              <Badge variant="outline" className="text-xs">
                {event.category}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className={cn(
              "text-lg font-bold tabular-nums",
              event.severity >= 80 ? "text-red-400" : 
              event.severity >= 60 ? "text-orange-400" : "text-foreground"
            )}>
              {event.severity}
            </div>
            <ConfidenceIndicator confidence={event.confidence} />
          </div>
        </div>
        
        <CardTitle className="text-lg leading-tight mt-2">
          {event.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {event.alert && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
            {event.alert}
          </p>
        )}
        
        {event.summary && event.summary.length > 0 && (
          <ul className="text-sm text-muted-foreground space-y-1">
            {event.summary.slice(0, 3).map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            {event.entities.slice(0, 3).map((entity, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {entity}
              </Badge>
            ))}
            {event.entities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{event.entities.length - 3}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {event.market_impact !== "none" && (
              <Badge className={cn("text-xs", getImpactBadge(event.market_impact))}>
                {event.market_impact.toUpperCase()}
              </Badge>
            )}
            <span>{timeAgo}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton
export function EventCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted" />
            <div className="w-16 h-5 rounded bg-muted" />
          </div>
          <div className="w-8 h-8 rounded bg-muted" />
        </div>
        <div className="w-full h-6 rounded bg-muted mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="w-full h-4 rounded bg-muted" />
          <div className="w-3/4 h-4 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
