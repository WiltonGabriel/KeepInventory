
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FirebaseClientProvider, initializeFirebase, useUser } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  Auth,
} from "firebase/auth";


function LoginPageContent() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [email, setEmail] = useState("admin@univag.com.br");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const { auth: firebaseAuth } = initializeFirebase();
    setAuth(firebaseAuth);
  }, []);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isUserLoading, router]);


  const handleLogin = async () => {
    if (!auth) return;
    setError(null);
    if (!email || !password) {
      setError("Por favor, preencha o e-mail e a senha corretamente.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O useEffect acima irá lidar com o redirecionamento
    } catch (e: any) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
           // O useEffect acima irá lidar com o redirecionamento
        } catch (creationError: any) {
          setError(creationError.message);
        }
      } else {
        setError(e.message);
      }
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="loader"></div>
        <style jsx>{`
          .loader {
            border: 4px solid hsl(var(--muted));
            border-top: 4px solid hsl(var(--primary));
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm relative">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-5xl font-black text-secondary tracking-tight">UNIVAG</CardTitle>
          <CardDescription>
            Sistema de Gestão Patrimonial (SGP)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Erro de Login</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="admin@univag.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
               onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button className="w-full" onClick={handleLogin}>
            Entrar
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            KeepInventory
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}


export default function LoginPage() {
  return (
    <FirebaseClientProvider>
      <LoginPageContent />
    </FirebaseClientProvider>
  );
}
