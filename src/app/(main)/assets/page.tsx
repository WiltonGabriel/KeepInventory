
"use client";

import { useState, useMemo } from "react";
import { Asset, Room, Sector, Block, AssetStatus } from "@/lib/types";
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

export default function AssetsPage() {
  const firestore = useFirestore();
  const assetsCollection = useMemoFirebase(() => firestore ? collection(firestore, "assets") : null, [firestore]);
  const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, "rooms") : null, [firestore]);
  const sectorsCollection = useMemoFirebase(() => firestore ? collection(firestore, "sectors") : null, [firestore]);
  const blocksCollection = useMemoFirebase(() => firestore ? collection(firestore, "blocks") : null, [firestore]);

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

  const handleDelete = async (id: string) => {
    if (!firestore) return;

    try {
        const batch = writeBatch(firestore);

        // Reference to the asset itself
        const assetRef = doc(firestore, "assets", id);

        // Reference to the nested 'movements' subcollection
        const movementsRef = collection(firestore, "assets", id, "movements");

        // Get all movement documents to delete them
        const movementsSnapshot = await getDocs(movementsRef);
        movementsSnapshot.forEach(movementDoc => {
            batch.delete(movementDoc.ref);
        });

        // Delete the main asset
        batch.delete(assetRef);

        await batch.commit();

        toast({ title: "Patrimônio removido", description: "O item e seu histórico foram removidos com sucesso." });
    } catch (error) {
        const contextualError = new FirestorePermissionError({
            operation: 'delete',
            path: `assets/${id} and its subcollections`,
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
      collection(firestore, "assets"),
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

  const logMovement = (batch: WriteBatch, assetId: string, assetName: string, action: "Criado" | "Status Alterado" | "Movido" | "Nome Alterado", from: string, to: string) => {
      if (!firestore) return;
      const movementRef = doc(collection(firestore, 'assets', assetId, 'movements'));
      batch.set(movementRef, {
          assetId, // Keep assetId for potential denormalized queries later
          assetName,
          action,
          from,
          to,
          timestamp: serverTimestamp(),
      });
  }

  const handleFormSubmit = async (values: Pick<Asset, 'name' | 'status' | 'roomId'>) => {
    if (!firestore || !rooms) return;

    try {
      const batch = writeBatch(firestore);

      if (editingAsset) { // Logic for UPDATE
          const assetRef = doc(firestore, "assets", editingAsset.id);
          const updates: Partial<Asset> = {};
          let changed = false;

          if (values.name !== editingAsset.name) {
              updates.name = values.name;
              logMovement(batch, editingAsset.id, values.name, "Nome Alterado", editingAsset.name, values.name);
              changed = true;
          }
          if (values.status !== editingAsset.status) {
              updates.status = values.status;
              logMovement(batch, editingAsset.id, values.name, "Status Alterado", editingAsset.status, values.status);
              changed = true;
          }
          if (values.roomId !== editingAsset.roomId) {
              updates.roomId = values.roomId;
              const fromRoom = rooms.find(r => r.id === editingAsset.roomId)?.name || 'N/A';
              const toRoom = rooms.find(r => r.id === values.roomId)?.name || 'N/A';
              logMovement(batch, editingAsset.id, values.name, "Movido", fromRoom, toRoom);
              changed = true;
          }

          if (changed) {
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
          const assetRef = doc(firestore, "assets", newId);
          batch.set(assetRef, newAssetData);

          logMovement(batch, newId, values.name, "Criado", "N/A", values.name);

          await batch.commit();
          toast({ title: "Patrimônio adicionado", description: `Um novo item (${newId}) foi criado com sucesso.` });
      }

      setIsFormOpen(false);
      setEditingAsset(undefined);

    } catch (error) {
       const contextualError = new FirestorePermissionError({
            operation: editingAsset ? 'update' : 'create',
            path: `assets/${editingAsset?.id || 'new-asset'}`,
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
      cell: ({ row }: { row: { original: Asset } }) => (
        <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
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
                <AlertDialogAction onClick={() => handleDelete(row.original.id)}>
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
