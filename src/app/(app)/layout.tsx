
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuthSession } from '@/auth/provider';
import { FirebaseClientProvider } from '@/firebase'; // Importado aqui
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Building, LogOut } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { MainNav } from '@/components/main-nav';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

// Componente de Carregamento
function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p className="text-lg text-muted-foreground">Carregando aplicação...</p>
    </div>
  );
}

// Layout Protegido
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, signOut } = useAuthSession();
  const router = useRouter();

  React.useEffect(() => {
    // Se não estiver carregando e não houver usuário, redireciona para o login.
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Exibe a tela de carregamento enquanto o estado de autenticação é verificado.
  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  // Se o usuário estiver autenticado, exibe o layout principal da aplicação.
  return (
    <FirebaseClientProvider> {/* O provider do Firebase agora envolve apenas o conteúdo protegido */}
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Building className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">KeepInventory</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-2 p-2">
              <Avatar className="border-2 border-primary/50">
                 <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold truncate">{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} className="ml-auto">
                  <LogOut className="h-4 w-4"/>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <SiteHeader />
          <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}

// Componente Raiz do Layout que envolve tudo com o AuthProvider.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </AuthProvider>
  );
}
