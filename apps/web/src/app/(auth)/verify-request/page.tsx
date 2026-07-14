import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const MagicLinkFirstStep = () =>
  process.env.NODE_ENV === 'development' ? (
    <p className="text-sm text-blue-800">
      Abra o Mailpit em{' '}
      <a
        href={`http://localhost:${process.env.SMTP_HTTP_PORT}`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-blue-600"
      >
        localhost:{process.env.SMTP_HTTP_PORT}
      </a>{' '}
      para ver o email.
    </p>
  ) : (
    'Abra seu aplicativo de email.'
  );

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="rounded-full bg-blue-100 p-3 mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Verifique seu email
          </CardTitle>
          <CardDescription className="text-center text-slate-500 text-base">
            Enviamos um link de acesso para o seu email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 border border-blue-100">
            <p className="font-medium mb-1">Próximos passos:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>
                <MagicLinkFirstStep />
              </li>
              <li>Clique no link mágico que enviamos.</li>
              <li>Você será logado automaticamente.</li>
            </ol>
          </div>

          <p className="text-xs text-center text-slate-400 px-4">
            Dica: Se não encontrar, verifique a pasta de <strong>Spam</strong>{' '}
            ou <strong>Lixo Eletrônico</strong>.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" asChild className="w-full">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-slate-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
