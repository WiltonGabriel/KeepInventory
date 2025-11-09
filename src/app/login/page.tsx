"use client";

import { useState } from "react";
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
import { Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    setError(null);

    if (!email || !password) {
      setError("Por favor, preencha o e-mail e a senha corretamente.");
      return;
    }
    
    if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    if (email.toLowerCase() === "admin@univag.com.br" && password === "123456") {
      if (typeof window !== "undefined") {
        localStorage.setItem("isLoggedIn", "true");
        // Dispara um evento para notificar outras abas/janelas
        window.dispatchEvent(new StorageEvent('storage', { key: 'isLoggedIn' }));
        router.replace("/");
      }
    } else {
      setError("E-mail ou senha incorreta.");
    }
  };

  const handleBypassLogin = () => {
    if (typeof window !== "undefined") {
        localStorage.setItem("isLoggedIn", "true");
        window.dispatchEvent(new StorageEvent('storage', { key: 'isLoggedIn' }));
        router.replace("/");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm relative">
        <button 
            onClick={handleBypassLogin}
            className="absolute top-0 right-0 w-12 h-12 bg-transparent z-10"
            aria-label="Bypass login"
        ></button>
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
             <Building className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">AssetWise Inventory</CardTitle>
          <CardDescription>
            Faça login para gerenciar seu inventário
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
        <CardFooter>
          <Button className="w-full" onClick={handleLogin}>
            Entrar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
