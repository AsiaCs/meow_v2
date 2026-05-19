export default function AuthError() {
  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Authentication Error</h1>
        <p className="text-text-secondary mb-6">Something went wrong. Please try again.</p>
        <a href="/auth/signin" className="text-purple-light hover:underline">Back to Sign In</a>
      </div>
    </main>
  )
}
