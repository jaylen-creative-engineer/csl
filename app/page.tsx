import Link from "next/link";
import { SupabaseIntegrationStatus } from "./supabase-integration-status";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--foreground)] leading-[0.95] uppercase">
            Creative Sports League
          </h1>
          <p className="mt-6 text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
            Structured challenge sprints for emerging creatives. Prove your skill, build your portfolio, get discovered.
          </p>
          
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/learner"
              className="inline-flex items-center px-6 py-3 text-base font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity"
            >
              Start Competing
            </Link>
            <Link
              href="/host"
              className="inline-flex items-center px-6 py-3 text-base font-medium text-[var(--foreground)] bg-[var(--secondary)] rounded-full hover:bg-[var(--border-soft)] transition-colors"
            >
              Run a League
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              title="Prove Your Skill"
              description="Compete in time-boxed challenge sprints with real prompts, public submissions, and scored outputs. Your work speaks for itself."
            />
            <FeatureCard
              title="Run a League"
              description="Manage cohorts, configure challenges, invite participants, and publish results. Build your community."
            />
            <FeatureCard
              title="Sponsor a Sprint"
              description="Embed your brief inside a challenge. Discover top performers before anyone else. Turn competition into a talent pipeline."
            />
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="p-6 bg-[var(--secondary)] rounded-none">
            <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide">
              System Status
            </h2>
            <div className="mt-3">
              <SupabaseIntegrationStatus />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8 bg-[var(--secondary)]">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        {title}
      </h2>
      <p className="mt-3 text-[var(--muted-foreground)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
