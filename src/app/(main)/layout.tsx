
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { collection, query, where, getDocs, addDoc, limit } from "firebase/firestore";

function MainLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.replace("/login");
    } else if (firestore) {
      // Seed initial data if it doesn't exist
      const seedData = async () => {
        try {
          // Check for Block A
          const blocksRef = collection(firestore, 'blocos');
          const blockQuery = query(blocksRef, where('name', '==', 'Bloco A'), limit(1));
          const blockSnapshot = await getDocs(blockQuery);
          let blockId: string;

          if (blockSnapshot.empty) {
            const blockDoc = await addDoc(blocksRef, { name: 'Bloco A' });
            blockId = blockDoc.id;
          } else {
            blockId = blockSnapshot.docs[0].id;
          }

          // Check for TI Sector
          const sectorsRef = collection(firestore, 'setores');
          const sectorQuery = query(sectorsRef, where('name', '==', 'Tecnologia da Informação'), limit(1));
          const sectorSnapshot = await getDocs(sectorQuery);

          if (sectorSnapshot.empty) {
            await addDoc(sectorsRef, {
              name: 'Tecnologia da Informação',
              abbreviation: 'TIN',
              blockId: blockId,
            });
          }
        } catch (error) {
          console.error("Error seeding initial data:", error);
        }
      };
      seedData();
    }
  }, [isUserLoading, user, router, firestore]);


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
