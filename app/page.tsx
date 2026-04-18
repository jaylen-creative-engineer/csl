import { SupabaseIntegrationStatus } from "./supabase-integration-status.js";

export default function HomePage() {
  return (
    <main className="min-h-screen p-12 font-sans">
      <header className="mb-16">
        <h1 className="text-5xl font-bold tracking-tight">Creative Sports League</h1>
        <p className="mt-4 text-xl text-gray-600">
          Structured challenge sprints for emerging creatives.
        </p>
        <aside className="mt-8 max-w-xl rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h2 className="text-sm font-semibold text-gray-800">Supabase integration</h2>
          <div className="mt-2">
            <SupabaseIntegrationStatus />
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Uses <code className="rounded bg-gray-200 px-1">/api/supabase/health</code> with your{" "}
            <code className="rounded bg-gray-200 px-1">.env.local</code> project URL and publishable
            key.
          </p>
        </aside>
      </header>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold">Prove your skill</h2>
          <p className="mt-3 text-gray-600">
            Compete in time-boxed challenge sprints with real prompts, public submissions,
            and scored outputs. Your work speaks for itself.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold">Run a league</h2>
          <p className="mt-3 text-gray-600">
            League hosts manage cohorts, configure challenges, invite participants,
            and publish results. Build your community and become a grassroots distribution engine.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold">Sponsor a sprint</h2>
          <p className="mt-3 text-gray-600">
            Embed your brief inside a challenge. Discover top performers before anyone else.
            Turn creative competition into a talent pipeline.
          </p>
        </div>
      </section>
    </main>
  );
}
