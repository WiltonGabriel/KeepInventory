
"use client";

import { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/lib/data";
import { Asset, Room, Sector, Block, AssetStatus } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AssetForm } from "./asset-form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const { toast } = useToast();

  const loadData = () => {
    setAssets(inventoryService.getAll("assets") as Asset[]);
    setRooms(inventoryService.getAll("rooms") as Room[]);
    setSectors(inventoryService.getAll("sectors") as Sector[]);
    setBlocks(inventoryService.getAll("blocks") as Block[]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingAsset(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    inventoryService.delete("assets", id);
    loadData();
    toast({ title: "Patrimônio removido", description: "O item foi removido com sucesso." });
  };

  const handleFormSubmit = (values: Omit<Asset, 'id'>) => {
    if (editingAsset) {
      // The ID is generated based on location, so it might change on edit. 
      // A simple update is tricky. Let's delete and re-add.
      // For a real app, we'd have stable IDs.
      inventoryService.delete("assets", editingAsset.id);
      inventoryService.add("assets", values);
      toast({ title: "Patrimônio atualizado", description: "As informações do item foram salvas." });
    } else {
      inventoryService.add("assets", values);
      toast({ title: "Patrimônio adicionado", description: "Um novo item foi criado com sucesso." });
    }
    loadData();
    setIsFormOpen(false);
    setEditingAsset(undefined);
  };

  const getFullLocation = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return 'N/A';
    const sector = sectors.find(s => s.id === room.sectorId);
    if (!sector) return room.name;
    const block = blocks.find(b => b.id === sector.blockId);
    return `${block?.name || 'N/A'} / ${sector.name} / ${room.name}`;
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFullLocation(asset.roomId).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery, rooms, sectors, blocks]);

  const getStatusVariant = (status: AssetStatus) => {
    switch (status) {
      case "Em Uso":
        return "default";
      case "Guardado":
        return "secondary";
      case "Perdido":
        return "destructive";
      case "Desconhecido":
      default:
        return "outline";
    }
  };

  const columns = [
    {
      accessorKey: "id",
      header: "ID",
      cell: (item: Asset) => <span className="font-mono text-xs">{item.id}</span>,
    },
    {
      accessorKey: "name",
      header: "Nome",
      cell: (item: Asset) => item.name,
    },
     {
      accessorKey: "status",
      header: "Status",
      cell: (item: Asset) => (
        <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
      ),
    },
    {
      accessorKey: "location",
      header: "Localização",
      cell: (item: Asset) => getFullLocation(item.roomId),
    },
    {
      accessorKey: "actions",
      header: "Ações",
      cell: (item: Asset) => (
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
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
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o item de patrimônio.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(item.id)}>
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
            blocks={blocks}
            allSectors={sectors}
            allRooms={rooms}
          />
        </DialogContent>
      </Dialog>
      
      <DataTable
        columns={columns}
        data={filteredAssets}
        emptyStateMessage="Nenhum patrimônio encontrado."
      />
    </div>
  );
}
