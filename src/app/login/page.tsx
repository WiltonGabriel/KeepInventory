'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, AuthErrorCodes } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Página de Login independente que inicializa seu próprio Firebase Auth.
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Inicializa o Firebase e obtém a instância de autenticação localmente.
  const auth = getAuth(initializeFirebase().firebaseApp);

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      // Tenta fazer o login primeiro.
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login bem-sucedido!', description: 'Redirecionando para o dashboard...' });
      router.push('/dashboard');
    } catch (error: any) {
      // Se o usuário não for encontrado, cria uma nova conta.
      if (error.code === AuthErrorCodes.USER_DELETED || error.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          toast({ title: 'Conta criada com sucesso!', description: 'Redirecionando para o dashboard...' });
          router.push('/dashboard');
        } catch (createError: any) {
          toast({ variant: 'destructive', title: 'Erro ao criar conta', description: createError.message });
        }
      } else {
        // Lida com outros erros de login (senha incorreta, etc.)
        let friendlyMessage = 'Ocorreu um erro ao tentar fazer login.';
        if (error.code === AuthErrorCodes.INVALID_PASSWORD) {
            friendlyMessage = 'Senha incorreta. Por favor, tente novamente.';
        } else if (error.code === AuthErrorCodes.INVALID_EMAIL) {
            friendlyMessage = 'O formato do e-mail é inválido.';
        }
        toast({ variant: 'destructive', title: 'Erro de Login', description: friendlyMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center space-y-6">
        <div className="flex items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">KeepInventory</h1>
        </div>
        <Card className="w-full">
          <CardContent className="grid gap-4 pt-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleAuth} className="w-full" disabled={isLoading}>
              {isLoading ? 'Carregando...' : 'Entrar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
