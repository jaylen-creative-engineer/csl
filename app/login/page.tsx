import Link from "next/link";
import { sendMagicLink, signInWithPassword, signUpWithPassword } from "./actions";
import { DEFAULT_AUTH_NEXT_PATH, safeNextPath } from "@/lib/auth/redirect.js";

type SearchParams = {
  error?: string;
  message?: string;
  next?: string;
};

type LoginPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next ?? DEFAULT_AUTH_NEXT_PATH);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <span className="mr-2">←</span> Home
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-[var(--foreground)] md:text-4xl">
            Sign in to CSL
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
            Use Supabase Auth to create a session for league hosting, enrollment, submissions,
            judging, and sponsor workflows.
          </p>
        </header>

        {params.error && (
          <div className="mb-6 border border-[var(--destructive)] bg-[var(--secondary)] p-4 text-sm text-[var(--destructive)]">
            {params.error}
          </div>
        )}

        {params.message && (
          <div className="mb-6 bg-[var(--success)] p-4 text-sm font-medium text-[var(--primary-foreground)]">
            {params.message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="bg-[var(--secondary)] p-8">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Email and password</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Sign in with an existing account or create a new one.
            </p>

            <form className="mt-6 grid gap-4">
              <input type="hidden" name="next" value={next} />
              <AuthInput id="email" label="Email" name="email" type="email" autoComplete="email" />
              <AuthInput
                id="password"
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  formAction={signInWithPassword}
                  className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 text-base font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
                >
                  Sign in
                </button>
                <button
                  formAction={signUpWithPassword}
                  className="inline-flex items-center justify-center rounded-full bg-[var(--background)] px-6 py-3 text-base font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border-soft)]"
                >
                  Sign up
                </button>
              </div>
            </form>
          </section>

          <section className="bg-[var(--secondary)] p-8">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Magic link</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Send a one-time sign-in link. Configure Supabase email redirects to point back to
              this app&apos;s auth callback.
            </p>

            <form className="mt-6 grid gap-4" action={sendMagicLink}>
              <input type="hidden" name="next" value={next} />
              <AuthInput
                id="magic-email"
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
              />
              <button className="inline-flex w-fit items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 text-base font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90">
                Send magic link
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function AuthInput({
  id,
  label,
  name,
  type,
  autoComplete,
  minLength,
}: {
  id: string;
  label: string;
  name: string;
  type: "email" | "password";
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-[var(--foreground)]">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className="w-full border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--foreground)] focus:outline-none"
      />
    </div>
  );
}
