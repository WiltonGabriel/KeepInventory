
'use client';

import React from 'react';
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
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useUser } from '@/firebase/auth/use-user';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getAuth } from 'firebase/auth';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = getAuth();

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    redirect('/login');
    return null;
  }
  
  const getInitials = (email: string | null | undefined) => {
    return email ? email.substring(0, 2).toUpperCase() : '??';
  };

  return (
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
          <div className="flex items-center gap-3 p-3">
             <Avatar>
                <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow overflow-hidden">
                <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => auth.signOut()}>
                <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <SiteHeader />
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </FirebaseClientProvider>
  );
}
