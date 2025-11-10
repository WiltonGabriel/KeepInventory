
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Building } from 'lucide-react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  AuthError,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebase } from '@/firebase';

// Initialize firebase outside component to avoid re-initialization
const { auth } = initializeFirebase();

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o e-mail e a senha.',
      });
      return;
    }

    setIsLoading(true);

    try {
      // First, try to sign in
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/dashboard');
    } catch (error) {
      const authError = error as AuthError;
      
      // If user does not exist, create a new account
      if (authError.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          router.replace('/dashboard');
        } catch (createError) {
          const createAuthError = createError as AuthError;
          toast({
            variant: 'destructive',
            title: 'Erro ao criar conta',
            description: createAuthError.message,
          });
        }
      } else {
        // Handle other sign-in errors
        toast({
          variant: 'destructive',
          title: 'Erro de Autenticação',
          description: authError.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Building className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">KeepInventory</CardTitle>
          <CardDescription>Sistema de Gestão Patrimonial</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar / Cadastrar'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
