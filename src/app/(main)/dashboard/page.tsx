
"use client";

import { useEffect, useState } from "react";
import { inventoryService } from "@/lib/data";
import { Block, Sector, Room, Asset, UserProfile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Archive, Building, DoorOpen, Building2 } from "lucide-react";

type Stats = {
  assetCount: number;
  roomCount: number;
  sectorCount: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ assetCount: 0, roomCount: 0, sectorCount: 0 });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setStats(inventoryService.getStats());
    setBlocks(inventoryService.getAll("blocks") as Block[]);
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const getSectorsForBlock = (blockId: string) => {
    return inventoryService.getSectorsByBlockId(blockId);
  };
  const getRoomsForSector = (sectorId: string) => {
    return inventoryService.getRoomsBySectorId(sectorId);
  };
  const getAssetsForRoom = (roomId: string) => {
    return inventoryService.getAssetsByRoomId(roomId);
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {user ? `Olá, ${user.name}!` : "Início (Dashboard)"}
      </h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Patrimônios</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assetCount}</div>
            <p className="text-xs text-muted-foreground">Itens cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Ativos</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assetCount}</div>
            <p className="text-xs text-muted-foreground">Status normal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sectorCount}</div>
            <p className="text-xs text-muted-foreground">Setores mapeados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hierarquia do Inventário</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {blocks.map((block) => (
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
    </div>
  );
}
