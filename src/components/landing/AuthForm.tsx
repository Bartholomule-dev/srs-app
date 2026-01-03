'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function AuthForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);

    try {
      await signIn(email);
      setMessage({ type: 'success', text: 'Check your email for the login link!' });
      setEmail('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm" id="auth">
      <div className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button
          type="submit"
          disabled={sending}
          className="w-full"
        >
          {sending ? 'Sending...' : 'Send Magic Link'}
        </Button>
      </div>
      {message && (
        <Alert
          variant={message.type === 'success' ? 'success' : 'error'}
          className="mt-3"
        >
          {message.text}
        </Alert>
      )}
    </form>
  );
}
