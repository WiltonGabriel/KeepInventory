
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Asset, LogEspecifico } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Edit3, PlusCircle } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

interface HistoryLogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryLog({ asset, open, onOpenChange }: HistoryLogProps) {
  const firestore = useFirestore();

  // Consulta a sub-coleção 'log_especifico' dentro do documento do patrimônio
  const specificLogQuery = useMemoFirebase(
    () =>
      firestore && asset
        ? query(
            collection(firestore, "patrimonios", asset.id, "log_especifico"),
            orderBy("timestamp", "desc")
          )
        : null,
    [firestore, asset]
  );

  const { data: assetLogs, isLoading } = useCollection<LogEspecifico>(specificLogQuery);

  const getActionIcon = (action: LogEspecifico["action"]) => {
    switch(action) {
      case 'Criado':
        return <PlusCircle className="h-4 w-4 text-green-500" />;
      case 'Status Alterado':
        return <Edit3 className="h-4 w-4 text-blue-500" />;
      case 'Movido':
        return <ArrowRight className="h-4 w-4 text-orange-500" />;
      case 'Nome Alterado':
        return <Edit3 className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  }

  const renderMovementDetails = (log: LogEspecifico) => {
    switch (log.action) {
      case "Criado":
        return `Patrimônio "${log.to}" foi criado.`;
      case "Status Alterado":
        return (
          <>
            Status alterado de <Badge variant="outline">{log.from}</Badge> para <Badge variant="outline">{log.to}</Badge>.
          </>
        );
      case "Movido":
        return (
          <>
            Movido de <Badge variant="secondary">{log.from}</Badge> para <Badge variant="secondary">{log.to}</Badge>.
          </>
        );
      case "Nome Alterado":
        return (
            <>
                Nome alterado de <span className="font-semibold">{log.from}</span> para <span className="font-semibold">{log.to}</span>.
            </>
        );
      default:
        return "Ação desconhecida.";
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Histórico de: {asset?.name}</DialogTitle>
          <DialogDescription>ID: {asset?.id}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full rounded-md border">
            <div className="p-4">
                {isLoading && <p className="text-muted-foreground">Carregando histórico...</p>}
                {!isLoading && assetLogs?.length === 0 && (
                    <p className="text-muted-foreground">Nenhuma movimentação encontrada para este item.</p>
                )}
                {assetLogs && assetLogs.length > 0 && (
                    <ul className="space-y-4">
                        {assetLogs.map((log) => (
                            <li key={log.id} className="flex items-start gap-4">
                                <div className="flex-shrink-0 pt-1">{getActionIcon(log.action)}</div>
                                <div className="flex-grow">
                                    <div className="text-sm">{renderMovementDetails(log)}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {log.timestamp ? format(log.timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data desconhecida'}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
