
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Building } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { MainNav } from "@/components/main-nav";
import { useUser } from "@/firebase";
import { FirebaseClientProvider } from "@/firebase/client-provider";

function MainLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // If the user state is still loading, do nothing.
    if (isUserLoading) {
      return;
    }
    // Once loading is complete, if there is no user, redirect to login.
    if (!user) {
      router.replace("/login");
    }
  }, [isUserLoading, user, router]);

  // While loading or if there's no user, show a loading screen.
  // This prevents content from flashing before the redirect.
  if (isUserLoading || !user) {
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
  
  // If user is loaded and present, render the main application layout.
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Building className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">KeepInventory</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
        <SidebarFooter>
          {/* Optional: Add footer content like user profile */}
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
  )
}
