import Link from "next/link"

export default async function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; msg?: string }>
}) {
  const { reason, msg } = await searchParams
  const detail = msg ? decodeURIComponent(msg) : null

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg-base px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-meta uppercase tracking-[0.14em] text-text-muted">
          Authentication error
        </p>
        <h1 className="mt-3 font-display text-heading-l text-text-primary">
          Something didn&apos;t go through.
        </h1>
        {detail ? (
          <p className="mt-5 break-all rounded-lg border border-critical/20 bg-critical/10 px-4 py-3 text-left font-mono text-meta text-critical">
            {reason && (
              <span className="mb-1 block text-[11px] font-bold uppercase opacity-70">{reason}</span>
            )}
            {detail}
          </p>
        ) : (
          <p className="mt-5 text-body-m text-text-secondary">
            Something went wrong. Please try again.
          </p>
        )}
        <Link href="/auth/signin" className="link-underline mt-6 inline-block text-body-m font-medium text-brand">
          ← Back to sign in
        </Link>
      </div>
    </main>
  )
}
