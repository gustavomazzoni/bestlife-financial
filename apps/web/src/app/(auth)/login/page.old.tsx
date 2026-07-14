'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl,
      });

      console.log('Sign in result:', result);
      console.error('Sign in result:', result);

      if (result?.error) {
        console.error('Sign in error:', result.error);
        alert('Failed to send email. Please try again.');
      } else {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Verifique seu email
            </h2>
            <p className="mt-2 text-gray-600">
              Enviamos um link mágico para <strong>{email}</strong>
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Clique no link para fazer login.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Desenvolvimento:</strong> Abra o Mailpit em{' '}
                <a
                  href="http://localhost:8025"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  localhost:8025
                </a>{' '}
                para ver o email.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo ao LifeOS
          </h1>
          <p className="mt-2 text-gray-600">
            Sua jornada para a liberdade financeira
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Enviando...' : 'Entrar com Email'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Enviaremos um link mágico para fazer login.
        </p>
      </div>
    </div>
  );
}
