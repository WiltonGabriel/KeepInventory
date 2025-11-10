
"use client";

import { useEffect, useState, useMemo } from "react";
import { Block, UserProfile, Sector, Room, Asset } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Building, DoorOpen, Building2, BarChart3, History, CheckCircle } from "lucide-react";
import { useUser, useCollection, useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

type Stats = {
  assetCount: number;
  activeAssetCount: number;
  roomCount: number;
  sectorCount: number;
};

export default function DashboardPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    const { data: assets } = useCollection<Asset>(useMemo(() => collection(firestore, 'assets'), [firestore]));
    const { data: rooms } = useCollection<Room>(useMemo(() => collection(firestore, 'rooms'), [firestore]));
    const { data: sectors } = useCollection<Sector>(useMemo(() => collection(firestore, 'sectors'), [firestore]));
    const { data: blocks } = useCollection<Block>(useMemo(() => collection(firestore, 'blocks'), [firestore]));


  const stats: Stats = useMemo(() => {
    const assetCount = assets?.length || 0;
    const activeAssetCount = assets?.filter(a => a.status === 'Em Uso').length || 0;
    const roomCount = rooms?.length || 0;
    const sectorCount = sectors?.length || 0;
    return { assetCount, activeAssetCount, roomCount, sectorCount };
    }, [assets, rooms, sectors]);


  const getSectorsForBlock = (blockId: string) => {
    return sectors?.filter(s => s.blockId === blockId) || [];
  };
  const getRoomsForSector = (sectorId: string) => {
    return rooms?.filter(r => r.sectorId === sectorId) || [];
  };
  const getAssetsForRoom = (roomId: string) => {
    return assets?.filter(a => a.roomId === roomId) || [];
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {user ? `Olá, ${user.displayName}!` : "Tela inicial"}
      </h1>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="hierarchy">Explorar Hierarquia</TabsTrigger>
          <TabsTrigger value="activity">Últimas Movimentações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Patrimônios</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.assetCount}</div>
                <p className="text-xs text-muted-foreground">Itens cadastrados no sistema</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Itens Ativos</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.activeAssetCount}</div>
                <p className="text-xs text-muted-foreground">Itens com status "Em Uso"</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Setores</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.sectorCount}</div>
                <p className="text-xs text-muted-foreground">Setores mapeados na instituição</p>
                </CardContent>
            </Card>
          </div>
          <Card className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[300px]">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight">
                Gráficos em Breve
              </h3>
              <p className="text-sm text-muted-foreground">
                Esta área exibirá gráficos e visualizações sobre o inventário.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle>Hierarquia do Inventário</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {blocks?.map((block) => (
                  <AccordionItem value={`block-${block.id}`} key={block.id}>
                    <AccordionTrigger className="font-medium text-lg">
                      <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" /> {block.name}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-6">
                      <Accordion type="multiple" className="w-full">
                        {getSectorsForBlock(block.id).map((sector) => (
                          <AccordionItem value={`sector-${sector.id}`} key={sector.id}>
                            <AccordionTrigger className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-secondary"/> {sector.name}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-6">
                              <Accordion type="multiple" className="w-full">
                                {getRoomsForSector(sector.id).map((room) => (
                                  <AccordionItem value={`room-${room.id}`} key={room.id}>
                                    <AccordionTrigger>
                                    <div className="flex items-center gap-2">
                                      <DoorOpen className="h-5 w-5 text-accent"/> {room.name}
                                    </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pl-8">
                                      <ul className="space-y-2">
                                        {getAssetsForRoom(room.id).map((asset) => (
                                          <li key={asset.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Archive className="h-4 w-4"/>
                                            {asset.name} ({asset.id})
                                          </li>
                                        ))}
                                        {getAssetsForRoom(room.id).length === 0 && <p className="text-sm text-muted-foreground">Nenhum patrimônio nesta sala.</p>}
                                      </ul>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                                {getRoomsForSector(sector.id).length === 0 && <p className="pt-4 text-sm text-muted-foreground">Nenhuma sala neste setor.</p>}
                              </Accordion>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                        {getSectorsForBlock(block.id).length === 0 && <p className="pt-4 text-sm text-muted-foreground">Nenhum setor neste bloco.</p>}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
            <Card className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[400px]">
                <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <History className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                    Log de Movimentações
                </h3>
                <p className="text-sm text-muted-foreground">
                    Esta seção está em desenvolvimento. Em breve, você poderá visualizar o histórico de alterações e movimentações dos patrimônios.
                </p>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>

    </div>
  );
}
