import Link from 'next/link';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Mensagens de erro baseadas nos códigos do NextAuth
const errorMessages: Record<string, string> = {
  Configuration:
    'Houve um problema com a configuração do servidor de autenticação.',
  AccessDenied: 'Acesso negado. Você não tem permissão para acessar esta área.',
  Verification:
    'O link de login expirou ou já foi utilizado. Por favor, solicite um novo.',
  Default: 'Ocorreu um erro inesperado na autenticação. Tente novamente.',
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error || 'Default';
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="rounded-full bg-red-100 p-3 mb-2">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Ops! Algo deu errado
          </CardTitle>
          <CardDescription className="text-center text-slate-500">
            Não conseguimos completar seu login
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-100">
            {message}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/login">Solicitar novo link de acesso</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-slate-500"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar para a home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
