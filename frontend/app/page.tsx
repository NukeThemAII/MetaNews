import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  ArrowRight,
  Shield,
  TrendingUp,
  Bell,
  Code,
  Check
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-bold">MetaNews</span>
            <Badge variant="outline" className="text-xs">v2.0</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/feed" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Feed
            </Link>
            <Button size="sm">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container text-center">
          <Badge className="mb-4" variant="secondary">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            SYSTEM ONLINE
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Signal over Noise.
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Real-time OSINT and market intelligence engine that detects, verifies,
            scores, and distributes events that actually matter.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/feed">
              <Button size="lg" className="gap-2">
                View Live Feed
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Intelligence at Scale
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Shield}
              title="Intel Feed"
              description="Real-time global events sorted by severity and impact."
              href="/feed"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Markets"
              description="Quantified market impact analysis for every event."
              href="/feed?category=Market"
            />
            <FeatureCard
              icon={Bell}
              title="Alerts"
              description="Instant push notifications for severity ≥ 80 events."
              href="#alerts"
            />
            <FeatureCard
              icon={Code}
              title="API"
              description="Programmatic access to the intelligence engine."
              href="#api"
            />
          </div>
        </div>
      </section>

      {/* Scoring System */}
      <section className="py-20 bg-muted/30 border-t">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">
            AI-Powered Scoring
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Every event is analyzed and scored by our AI pipeline for severity,
            confidence, and market impact.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <ScoreCard severity={80} label="Critical" color="red" />
            <ScoreCard severity={60} label="Significant" color="orange" />
            <ScoreCard severity={40} label="Moderate" color="yellow" />
            <ScoreCard severity={20} label="Low" color="green" />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 border-t">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Choose Your Edge
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <PricingCard
              tier="Free"
              price="$0"
              description="Delayed feed for staying informed"
              features={[
                "All events with 30-60 min delay",
                "Daily digest email",
                "Basic filtering",
              ]}
            />
            <PricingCard
              tier="Premium"
              price="$29"
              description="Real-time edge for professionals"
              features={[
                "Instant real-time feed",
                "Telegram push alerts",
                "Priority severity ≥ 80",
                "Custom alert rules",
                "API access",
              ]}
              highlighted
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>MetaNews © 2026</span>
          </div>
          <div>
            Signal over noise. Speed over comfort. Facts over opinion.
          </div>
        </div>
      </footer>
    </main>
  );
}

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
  href
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="group p-6 rounded-lg border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
        <div className="p-2 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
          {title}
          <ArrowRight className="inline-block ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </Link>
  );
}

// Score indicator card
function ScoreCard({
  severity,
  label,
  color
}: {
  severity: number;
  label: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  return (
    <div className={`p-4 rounded-lg border text-center ${colorClasses[color]}`}>
      <div className="text-3xl font-bold mb-1">{severity}+</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}

// Pricing card
function PricingCard({
  tier,
  price,
  description,
  features,
  highlighted
}: {
  tier: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div className={`p-6 rounded-lg border ${highlighted ? 'border-primary bg-primary/5' : 'bg-card'}`}>
      <div className="mb-4">
        <h3 className="text-xl font-bold">{tier}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        {price !== "$0" && <span className="text-muted-foreground">/month</span>}
      </div>
      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            {feature}
          </li>
        ))}
      </ul>
      <Button className="w-full" variant={highlighted ? "default" : "outline"}>
        {highlighted ? "Start Free Trial" : "Get Started"}
      </Button>
    </div>
  );
}
