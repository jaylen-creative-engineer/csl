import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl bg-[var(--secondary)] p-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">
          Authentication error
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          CSL could not complete the sign-in flow. Try again or check the Supabase Auth redirect
          configuration.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center rounded-full bg-[var(--primary)] px-6 py-3 text-base font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
