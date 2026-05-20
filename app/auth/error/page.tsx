export default async function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; msg?: string }>
}) {
  const { reason, msg } = await searchParams
  const detail = msg ? decodeURIComponent(msg) : null

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Authentication Error</h1>
        {detail ? (
          <p className="text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 text-sm mb-4 text-left font-mono break-all">
            {reason && <span className="font-bold uppercase text-xs block mb-1 opacity-60">{reason}</span>}
            {detail}
          </p>
        ) : (
          <p className="text-text-secondary mb-4">Something went wrong. Please try again.</p>
        )}
        <a href="/auth/signin" className="text-purple-light hover:underline text-sm">
          ← Back to Sign In
        </a>
      </div>
    </main>
  )
}
