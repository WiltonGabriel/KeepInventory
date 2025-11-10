
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuthSession } from '@/auth/provider';
import {
  Block,
  Sector,
  Room,
  Asset,
  LogGeral,
} from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Archive,
  Building,
  DoorOpen,
  Building2,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  History,
} from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Stats = {
  assetCount: number;
  roomCount: number;
  sectorCount: number;
  blockCount: number;
  activeAssetCount: number;
  lostAssetCount: number;
};

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useAuthSession();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const getCurrentGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 12) {
        return 'Bom dia';
      }
      if (currentHour >= 12 && currentHour < 18) {
        return 'Boa tarde';
      }
      return 'Boa noite';
    };
    setGreeting(getCurrentGreeting());
  }, []);

  const assetsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'patrimonios') : null),
    [firestore]
  );
  const roomsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'salas') : null),
    [firestore]
  );
  const sectorsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'setores') : null),
    [firestore]
  );
  const blocksCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'blocos') : null),
    [firestore]
  );
  
  // Consulta a nova coleção principal 'log_geral'
  const generalLogQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'log_geral'),
            orderBy('timestamp', 'desc'),
            limit(10)
          )
        : null,
    [firestore]
  );
  
  const { data: assets } = useCollection<Asset>(assetsCollection);
  const { data: rooms } = useCollection<Room>(roomsCollection);
  const { data: sectors } = useCollection<Sector>(sectorsCollection);
  const { data: blocks } = useCollection<Block>(blocksCollection);
  const { data: recentLogs, isLoading: isLoadingLogs } = useCollection<LogGeral>(generalLogQuery);

  const stats: Stats = useMemo(() => {
    const assetCount = assets?.length || 0;
    const roomCount = rooms?.length || 0;
    const sectorCount = sectors?.length || 0;
    const blockCount = blocks?.length || 0;
    const activeAssetCount =
      assets?.filter((a) => a.status === 'Em Uso').length || 0;
    const lostAssetCount =
      assets?.filter((a) => a.status === 'Perdido').length || 0;
    return {
      assetCount,
      roomCount,
      sectorCount,
      blockCount,
      activeAssetCount,
      lostAssetCount,
    };
  }, [assets, rooms, sectors, blocks]);

  const getSectorsForBlock = (blockId: string) => {
    return sectors?.filter((s) => s.blockId === blockId) || [];
  };
  const getRoomsForSector = (sectorId: string) => {
    return rooms?.filter((r) => r.sectorId === sectorId) || [];
  };
  const getAssetsForRoom = (roomId: string) => {
    return assets?.filter((a) => a.roomId === roomId) || [];
  };

  const getUserFirstName = () => {
    if (!user?.email) return '';
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {greeting}, {getUserFirstName()}!
      </h1>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="hierarchy">Explorar Hierarquia</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Patrimônios
                </CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.assetCount}</div>
                <p className="text-xs text-muted-foreground">
                  Itens cadastrados no sistema
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Itens Ativos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeAssetCount}</div>
                <p className="text-xs text-muted-foreground">
                  Itens com status "Em Uso"
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Itens Perdidos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.lostAssetCount}</div>
                <p className="text-xs text-muted-foreground">
                  Itens com status "Perdido"
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Locais Mapeados
                </CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.blockCount + stats.sectorCount + stats.roomCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.blockCount} blocos, {stats.sectorCount} setores,{' '}
                  {stats.roomCount} salas
                </p>
              </CardContent>
            </Card>
          </div>
           <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Log de Atividade Recente</CardTitle>
                <CardDescription>As 10 últimas ações no inventário.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLogs && <p className="text-sm text-muted-foreground">Carregando atividades...</p>}
                {!isLoadingLogs && recentLogs?.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma atividade recente encontrada.</p>
                )}
                {recentLogs && recentLogs.length > 0 && (
                  <ul className="space-y-4">
                    {recentLogs.map((log) => (
                      <li key={log.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-1"><History className="h-4 w-4" /></div>
                        <div className="flex-grow">
                          <div className="text-sm">{log.acao}</div>
                          <p className="text-xs text-muted-foreground">
                            {log.timestamp ? format(log.timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR }) : 'Data desconhecida'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
           </div>
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
                          <AccordionItem
                            value={`sector-${sector.id}`}
                            key={sector.id}
                          >
                            <AccordionTrigger className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-secondary" />{' '}
                                {sector.name}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-6">
                              <Accordion type="multiple" className="w-full">
                                {getRoomsForSector(sector.id).map((room) => (
                                  <AccordionItem
                                    value={`room-${room.id}`}
                                    key={room.id}
                                  >
                                    <AccordionTrigger>
                                      <div className="flex items-center gap-2">
                                        <DoorOpen className="h-5 w-5 text-accent" />{' '}
                                        {room.name}
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pl-8">
                                      <ul className="space-y-2">
                                        {getAssetsForRoom(room.id).map(
                                          (asset) => (
                                            <li
                                              key={asset.id}
                                              className="flex items-center gap-2 text-sm text-muted-foreground"
                                            >
                                              <Archive className="h-4 w-4" />
                                              {asset.name} ({asset.id})
                                            </li>
                                          )
                                        )}
                                        {getAssetsForRoom(room.id).length ===
                                          0 && (
                                          <p className="text-sm text-muted-foreground">
                                            Nenhum patrimônio nesta sala.
                                          </p>
                                        )}
                                      </ul>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                                {getRoomsForSector(sector.id).length === 0 && (
                                  <p className="pt-4 text-sm text-muted-foreground">
                                    Nenhuma sala neste setor.
                                  </p>
                                )}
                              </Accordion>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                        {getSectorsForBlock(block.id).length === 0 && (
                          <p className="pt-4 text-sm text-muted-foreground">
                            Nenhum setor neste bloco.
                          </p>
                        )}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
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
      </Tabs>
    </div>
  );
}
