
"use client";

import { useState, useMemo } from "react";
import { Asset, Room, Sector, Block, AssetStatus, assetStatusOptions } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AssetForm } from "./asset-form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, getDocs, query, where, serverTimestamp, writeBatch, WriteBatch } from "firebase/firestore";
import { HistoryLog } from "./history-log";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AssetsPage() {
  const firestore = useFirestore();
  const assetsCollection = useMemoFirebase(() => firestore ? collection(firestore, "patrimonios") : null, [firestore]);
  const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, "salas") : null, [firestore]);
  const sectorsCollection = useMemoFirebase(() => firestore ? collection(firestore, "setores") : null, [firestore]);
  const blocksCollection = useMemoFirebase(() => firestore ? collection(firestore, "blocos") : null, [firestore]);
  // Coleção para o Log Geral do Dashboard
  const generalLogCollection = useMemoFirebase(() => firestore ? collection(firestore, "log_geral") : null, [firestore]);

  const { data: assets, isLoading: isLoadingAssets } = useCollection<Asset>(assetsCollection);
  const { data: rooms, isLoading: isLoadingRooms } = useCollection<Room>(roomsCollection);
  const { data: sectors, isLoading: isLoadingSectors } = useCollection<Sector>(sectorsCollection);
  const { data: blocks, isLoading: isLoadingBlocks } = useCollection<Block>(blocksCollection);

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [historyAsset, setHistoryAsset] = useState<Asset | null>(null);
  const { toast } = useToast();

  const handleAdd = () => {
    setEditingAsset(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleShowHistory = (asset: Asset) => {
    setHistoryAsset(asset);
  }

  const handleDelete = async (asset: Asset) => {
    if (!firestore) return;

    try {
        const batch = writeBatch(firestore);
        const assetRef = doc(firestore, "patrimonios", asset.id);
        
        // Loga a remoção no log geral
        if (generalLogCollection) {
          const generalLogRef = doc(generalLogCollection);
          batch.set(generalLogRef, { 
            acao: `Patrimônio "${asset.name}" (${asset.id}) foi removido.`,
            timestamp: serverTimestamp() 
          });
        }
        
        // Deleta o histórico específico do patrimônio
        const specificLogCollection = collection(firestore, "patrimonios", asset.id, "log_especifico");
        const specificLogSnapshot = await getDocs(specificLogCollection);
        specificLogSnapshot.forEach(logDoc => {
            batch.delete(logDoc.ref);
        });

        // Deleta o patrimônio
        batch.delete(assetRef);
        
        await batch.commit();
        toast({ title: "Patrimônio removido", description: "O item e todo o seu histórico foram removidos com sucesso." });
    } catch (error) {
        const contextualError = new FirestorePermissionError({
            operation: 'delete',
            path: `patrimonios/${asset.id} and its logs`,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({
            variant: "destructive",
            title: "Erro ao remover",
            description: "Não foi possível remover o patrimônio e seu histórico.",
        });
    }
};

  const generateNewAssetId = async (roomId: string) => {
    if (!firestore || !sectors || !rooms) return null;
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
        toast({ variant: "destructive", title: "Erro de Sala", description: "A sala selecionada não foi encontrada." });
        return null;
    }

    const sector = sectors.find(s => s.id === room.sectorId);
    if (!sector || !sector.abbreviation || sector.abbreviation.length !== 3) {
      toast({ variant: "destructive", title: "Erro de Setor", description: "O setor selecionado não possui uma sigla válida de 3 letras." });
      return null;
    }
    const prefix = sector.abbreviation.toUpperCase();

    const assetsWithPrefixQuery = query(
      collection(firestore, "patrimonios"),
      where("id", ">=", prefix),
      where("id", "<", prefix + 'z')
    );

    const querySnapshot = await getDocs(assetsWithPrefixQuery);
    let maxNumber = 0;
    querySnapshot.forEach(doc => {
      const docId = doc.id;
      if (docId.startsWith(prefix)) {
        const numberPart = parseInt(docId.substring(prefix.length), 10);
        if (!isNaN(numberPart) && numberPart > maxNumber) {
          maxNumber = numberPart;
        }
      }
    });

    const newNumber = maxNumber + 1;
    const newId = `${prefix}${newNumber.toString().padStart(3, '0')}`;
    return newId;
  }

  const logSpecificMovement = (batch: WriteBatch, assetId: string, assetName: string, action: "Criado" | "Status Alterado" | "Movido" | "Nome Alterado", from: string, to: string) => {
      if (!firestore) return;
      const logRef = doc(collection(firestore, "patrimonios", assetId, "log_especifico"));
      batch.set(logRef, {
          assetNameSnapshot: assetName,
          action,
          from,
          to,
          timestamp: serverTimestamp(),
      });
  }
  
  const handleStatusChange = async (asset: Asset, newStatus: AssetStatus) => {
    if (!firestore || !generalLogCollection || asset.status === newStatus) return;

    try {
        const batch = writeBatch(firestore);
        const assetRef = doc(firestore, "patrimonios", asset.id);
        
        batch.update(assetRef, { status: newStatus });

        // Log para o histórico específico
        logSpecificMovement(batch, asset.id, asset.name, "Status Alterado", asset.status, newStatus);
        
        // Log para o log geral
        const generalLogRef = doc(generalLogCollection);
        batch.set(generalLogRef, { 
            acao: `Status de "${asset.name}" (${asset.id}) alterado de "${asset.status}" para "${newStatus}".`,
            timestamp: serverTimestamp() 
        });

        await batch.commit();
        toast({ title: "Status atualizado!", description: `O status de "${asset.name}" foi alterado para "${newStatus}".` });
    } catch (error) {
        const contextualError = new FirestorePermissionError({
            operation: 'update',
            path: `patrimonios/${asset.id}`,
            requestResourceData: { status: newStatus },
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({
            variant: "destructive",
            title: "Erro ao atualizar status",
            description: "Não foi possível alterar o status do patrimônio.",
        });
    }
  };

  const handleFormSubmit = async (values: Pick<Asset, 'name' | 'status' | 'roomId'>) => {
    if (!firestore || !rooms || !generalLogCollection) return;

    try {
        const batch = writeBatch(firestore);

        if (editingAsset) { // Logic for UPDATE
            const assetRef = doc(firestore, "patrimonios", editingAsset.id);
            const updates: Partial<Asset> = {};

            if (values.name !== editingAsset.name) {
                updates.name = values.name;
                logSpecificMovement(batch, editingAsset.id, values.name, "Nome Alterado", editingAsset.name, values.name);
                // No general log for name change as per requirement
            }
            if (values.status !== editingAsset.status) {
                updates.status = values.status;
                logSpecificMovement(batch, editingAsset.id, values.name, "Status Alterado", editingAsset.status, values.status);
                
                const generalLogRef = doc(generalLogCollection);
                batch.set(generalLogRef, { 
                    acao: `Status de "${values.name}" (${editingAsset.id}) alterado para "${values.status}".`,
                    timestamp: serverTimestamp() 
                });
            }
            if (values.roomId !== editingAsset.roomId) {
                updates.roomId = values.roomId;
                const fromRoom = rooms.find(r => r.id === editingAsset.roomId)?.name || 'N/A';
                const toRoom = rooms.find(r => r.id === values.roomId)?.name || 'N/A';
                logSpecificMovement(batch, editingAsset.id, values.name, "Movido", fromRoom, toRoom);

                const generalLogRef = doc(generalLogCollection);
                batch.set(generalLogRef, { 
                    acao: `Patrimônio "${values.name}" (${editingAsset.id}) movido para "${toRoom}".`,
                    timestamp: serverTimestamp() 
                });
            }

            if (Object.keys(updates).length > 0) {
                batch.update(assetRef, updates);
                await batch.commit();
                toast({ title: "Patrimônio atualizado", description: "As informações do item foram salvas." });
            }
        } else { // Logic for CREATE
            const newId = await generateNewAssetId(values.roomId);
            if (!newId) {
                toast({ variant: "destructive", title: "Falha ao gerar ID", description: "Não foi possível gerar um novo ID para o patrimônio." });
                return;
            }
            
            const newAssetData = { name: values.name, roomId: values.roomId, status: values.status };
            const assetRef = doc(firestore, "patrimonios", newId);
            
            batch.set(assetRef, newAssetData);
            
            // Log para o histórico específico
            logSpecificMovement(batch, newId, values.name, "Criado", "N/A", values.name);
            
            // Log para o log geral do dashboard
            const generalLogRef = doc(generalLogCollection);
            batch.set(generalLogRef, { 
                acao: `Patrimônio "${values.name}" (${newId}) foi criado.`,
                timestamp: serverTimestamp() 
            });

            await batch.commit();
            toast({ title: "Patrimônio adicionado", description: `Um novo item (${newId}) foi criado com sucesso.` });
        }

        setIsFormOpen(false);
        setEditingAsset(undefined);

    } catch (error) {
       const contextualError = new FirestorePermissionError({
            operation: editingAsset ? 'update' : 'create',
            path: `patrimonios/${editingAsset?.id || 'new-asset'}`,
            requestResourceData: values,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({
            variant: "destructive",
            title: "Erro ao salvar",
            description: "Não foi possível salvar as informações do patrimônio.",
        });
    }
  };


  const getFullLocation = (roomId: string) => {
    if (!rooms || !sectors || !blocks) return 'Carregando...';
    const room = rooms.find(r => r.id === roomId);
    if (!room) return 'N/A';
    const sector = sectors.find(s => s.id === room.sectorId);
    if (!sector) return room.name;
    const block = blocks.find(b => b.id === sector.blockId);
    return `${block?.name || 'N/A'} / ${sector.name} / ${room.name}`;
  };

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFullLocation(asset.roomId).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery, rooms, sectors, blocks]);

  const getStatusVariant = (status: AssetStatus): "default" | "secondary" | "destructive" | "outline" | "warning" | "neutral" => {
    switch (status) {
      case "Em Uso":
        return "default";
      case "Guardado":
        return "warning";
      case "Perdido":
        return "destructive";
      case "Desconhecido":
      default:
        return "neutral";
    }
  };

  const isLoading = isLoadingAssets || isLoadingRooms || isLoadingSectors || isLoadingBlocks;

  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }: { row: { original: Asset } }) => <span className="font-mono text-xs">{row.original.id}</span>,
    },
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }: { row: { original: Asset } }) => (
        <button onClick={() => handleShowHistory(row.original)} className="text-primary hover:underline">
            {row.original.name}
        </button>
      ),
    },
     {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: Asset } }) => {
        const asset = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Badge variant={getStatusVariant(asset.status)} className="cursor-pointer">
                    {asset.status}
                </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {assetStatusOptions.map(statusOption => (
                <DropdownMenuItem 
                  key={statusOption} 
                  onSelect={() => handleStatusChange(asset, statusOption)}
                  disabled={asset.status === statusOption}
                  >
                  {statusOption}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      accessorKey: "location",
      header: "Localização",
      cell: ({ row }: { row: { original: Asset } }) => getFullLocation(row.original.roomId),
    },
    {
      accessorKey: "actions",
      header: "Ações",
      cell: ({ row }: { row: { original: Asset } }) => (
        <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleShowHistory(row.original)}>
                <History className="h-4 w-4" />
            </Button>
          <Button variant="outline" size="icon" onClick={() => handleEdit(row.original)}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o item de patrimônio e todo o seu histórico de movimentações.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(row.original)}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Patrimônios"
        addLabel="Cadastrar Patrimônio"
        onAdd={handleAdd}
        onSearch={setSearchQuery}
        searchPlaceholder="Pesquisar patrimônios..."
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) setEditingAsset(undefined); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Editar Patrimônio" : "Cadastrar Patrimônio"}</DialogTitle>
          </DialogHeader>
          <AssetForm
            onSubmit={handleFormSubmit}
            defaultValues={editingAsset}
            blocks={blocks || []}
            allSectors={sectors || []}
            allRooms={rooms || []}
          />
        </DialogContent>
      </Dialog>
      
      {historyAsset && (
        <HistoryLog asset={historyAsset} open={!!historyAsset} onOpenChange={(open) => !open && setHistoryAsset(null)} />
      )}

      <DataTable
        columns={columns}
        data={filteredAssets}
        emptyStateMessage={isLoading ? "Carregando..." : "Nenhum patrimônio encontrado."}
      />
    </div>
  );
}
