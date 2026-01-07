'use client';

import * as React from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Schema de validação Zod
const userAuthSchema = z.object({
  email: z.email('Por favor, insira um email válido.'),
});

type FormData = z.infer<typeof userAuthSchema>;

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);

  // Configuração do Formulário
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });

  // Login via Email (Magic Link)
  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const signInResult = await signIn('email', {
      email: data.email.toLowerCase(),
      callbackUrl: searchParams?.get('from') || '/dashboard',
    });

    setIsLoading(false);

    if (!signInResult?.ok) {
      // Aqui você poderia adicionar um Toast de erro
      return console.error('Erro ao fazer login');
    }

    // Se deu certo, o NextAuth redireciona automaticamente para a página verify-request
  }

  // Login via Google
  const loginWithGoogle = async () => {
    setIsGoogleLoading(true);
    await signIn('google', {
      callbackUrl: searchParams?.get('from') || '/dashboard',
    });
    // Não setamos false aqui porque a página vai redirecionar
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Bem-vindo de volta
          </CardTitle>
          <CardDescription>
            Escolha uma opção para entrar no LifeOS
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {/* Botão Google */}
          <Button
            variant="outline"
            onClick={loginWithGoogle}
            disabled={isLoading || isGoogleLoading}
            className="w-full"
          >
            {isGoogleLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.google className="mr-2 h-4 w-4" />
            )}
            Entrar com Google
          </Button>

          {/* Separador Visual */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground bg-white">
                Ou continue com email
              </span>
            </div>
          </div>

          {/* Formulário Email */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="nome@exemplo.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading || isGoogleLoading}
                  {...register('email')}
                />
                {errors?.email && (
                  <p className="px-1 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <Button disabled={isLoading || isGoogleLoading}>
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Entrar com Email
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
