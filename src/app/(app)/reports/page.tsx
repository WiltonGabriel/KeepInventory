'use client';

import {
  useCollection,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  query,
  orderBy
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Block, Sector, Room, Asset, LogGeral } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReportsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  // Hooks to get all necessary data
  const assetsCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'patrimonios') : null), [firestore]);
  const roomsCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'salas') : null), [firestore]);
  const sectorsCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'setores') : null), [firestore]);
  const blocksCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'blocos') : null), [firestore]);
  const generalLogQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'log_geral'), orderBy('timestamp', 'desc')) : null), [firestore]);

  const { data: assets, isLoading: loadingAssets } = useCollection<Asset>(assetsCollection);
  const { data: rooms, isLoading: loadingRooms } = useCollection<Room>(roomsCollection);
  const { data: sectors, isLoading: loadingSectors } = useCollection<Sector>(sectorsCollection);
  const { data: blocks, isLoading: loadingBlocks } = useCollection<Block>(blocksCollection);
  const { data: logs, isLoading: loadingLogs } = useCollection<LogGeral>(generalLogQuery);
  
  const isLoading = loadingAssets || loadingRooms || loadingSectors || loadingBlocks || loadingLogs;

  const escapeCsvField = (field: string | null | undefined): string => {
    if (field === null || field === undefined) {
      return '""';
    }
    const stringField = String(field);
    // If the field contains a comma, a quote, or a newline, wrap it in double quotes.
    if (/[",\n\r]/.test(stringField)) {
      // Also, double up any existing double quotes.
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return `"${stringField}"`;
  };

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportInventory = () => {
    if (!assets || !rooms || !sectors || !blocks) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Os dados ainda não foram carregados.' });
      return;
    }

    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const sectorMap = new Map(sectors.map(s => [s.id, s]));
    const blockMap = new Map(blocks.map(b => [b.id, b]));

    const csvHeader = ['ID', 'Nome', 'Status', 'Sala', 'Setor', 'Bloco'].join(',');
    
    const csvRows = assets.map(asset => {
      const room = roomMap.get(asset.roomId);
      const sector = room ? sectorMap.get(room.sectorId) : undefined;
      const block = sector ? blockMap.get(sector.blockId) : undefined;

      const row = [
        escapeCsvField(asset.id),
        escapeCsvField(asset.name),
        escapeCsvField(asset.status),
        escapeCsvField(room?.name),
        escapeCsvField(sector?.name),
        escapeCsvField(block?.name),
      ];
      return row.join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');
    downloadCsv(csvContent, `inventario_completo_${new Date().toISOString().split('T')[0]}.csv`);

    toast({ title: 'Sucesso!', description: 'O relatório de inventário foi gerado.' });
  };

  const handleExportActivityLog = () => {
    if (!logs) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Os logs de atividade ainda não foram carregados.' });
      return;
    }

    const csvHeader = ['Data', 'Ação'].join(',');
    
    const csvRows = logs.map(log => {
      const formattedDate = log.timestamp
        ? format(log.timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })
        : 'Data desconhecida';

      const row = [
        escapeCsvField(formattedDate),
        escapeCsvField(log.acao)
      ];
      return row.join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');
    downloadCsv(csvContent, `log_atividades_${new Date().toISOString().split('T')[0]}.csv`);

    toast({ title: 'Sucesso!', description: 'O log de atividades foi gerado.' });
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Inventory Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios de Inventário</CardTitle>
            <CardDescription>Exporte os dados completos do seu inventário para análise externa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExportInventory}
              disabled={isLoading || !assets || assets.length === 0}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Inventário Completo (.csv)
            </Button>
            {isLoading && <p className="text-sm text-muted-foreground mt-2 text-center">Carregando dados do inventário...</p>}
            {!isLoading && (!assets || assets.length === 0) && <p className="text-sm text-muted-foreground mt-2 text-center">Nenhum item no inventário para exportar.</p>}
          </CardContent>
        </Card>

        {/* Activity Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios de Atividade</CardTitle>
            <CardDescription>Exporte o histórico de todas as movimentações e ações realizadas no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExportActivityLog}
              disabled={isLoading || !logs || logs.length === 0}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Log de Atividade (.csv)
            </Button>
             {isLoading && <p className="text-sm text-muted-foreground mt-2 text-center">Carregando logs de atividade...</p>}
             {!isLoading && (!logs || logs.length === 0) && <p className="text-sm text-muted-foreground mt-2 text-center">Nenhuma atividade registrada para exportar.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
