import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) ?? '' }),
})

function UnsubscribePage() {
  const { token } = Route.useSearch()
  const [state, setState] = useState<'loading' | 'ready' | 'already' | 'invalid' | 'done' | 'submitting' | 'error'>('loading')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setState('invalid'); return }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) { setState('invalid'); return }
        if (data.alreadyUnsubscribed) { setEmail(data.email ?? null); setState('already'); return }
        setEmail(data.email ?? null)
        setState('ready')
      })
      .catch(() => setState('invalid'))
  }, [token])

  const confirm = async () => {
    setState('submitting')
    try {
      const r = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!r.ok) throw new Error()
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card border rounded-lg p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Unsubscribe</h1>
        {state === 'loading' && <p className="text-muted-foreground">Validating your request…</p>}
        {state === 'invalid' && <p className="text-destructive">This unsubscribe link is invalid or expired.</p>}
        {state === 'already' && <p className="text-muted-foreground">{email ?? 'You'} is already unsubscribed.</p>}
        {state === 'ready' && (
          <>
            <p className="text-muted-foreground">Stop receiving emails at {email ?? 'this address'}?</p>
            <Button onClick={confirm} variant="destructive">Confirm unsubscribe</Button>
          </>
        )}
        {state === 'submitting' && <p className="text-muted-foreground">Processing…</p>}
        {state === 'done' && <p>You've been unsubscribed. Sorry to see you go.</p>}
        {state === 'error' && (
          <>
            <p className="text-destructive">Something went wrong. Please try again.</p>
            <Button onClick={confirm}>Retry</Button>
          </>
        )}
      </div>
    </div>
  )
}