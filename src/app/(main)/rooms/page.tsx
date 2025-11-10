
"use client";

import { useEffect, useState, useMemo } from "react";
import { Room, Sector, Block } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RoomForm } from "./room-form";
import { useToast } from "@/hooks/use-toast";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);
  const { toast } = useToast();

  const loadData = () => {
    // TODO: Migrate to Firestore
    setRooms([]);
    setSectors([]);
    setBlocks([]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingRoom(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setIsFormOpen(true);
  };
  
  const handleDelete = (id: string) => {
    // TODO: Migrate to Firestore
    loadData();
    toast({ title: "Sala removida", description: "A sala e seus itens associados foram removidos." });
  };

  const handleFormSubmit = (values: Omit<Room, 'id'>) => {
    if (editingRoom) {
      // TODO: Migrate to Firestore
      toast({ title: "Sala atualizada", description: "As informações da sala foram salvas." });
    } else {
      // TODO: Migrate to Firestore
      toast({ title: "Sala adicionada", description: "Uma nova sala foi criada com sucesso." });
    }
    loadData();
    setIsFormOpen(false);
    setEditingRoom(undefined);
  };
  
  const getFullLocation = (sectorId: string) => {
    const sector = sectors.find(s => s.id === sectorId);
    if (!sector) return 'N/A';
    const block = blocks.find(b => b.id === sector.blockId);
    return `${block?.name || 'N/A'} / ${sector.name}`;
  }

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFullLocation(room.sectorId).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rooms, searchQuery, sectors, blocks]);

  const columns = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }: { row: { original: Room } }) => row.original.name,
    },
    {
      accessorKey: "location",
      header: "Localização (Bloco / Setor)",
      cell: ({ row }: { row: { original: Room } }) => getFullLocation(row.original.sectorId),
    },
    {
      accessorKey: "actions",
      header: "Ações",
      cell: ({ row }: { row: { original: Room } }) => (
        <div className="flex gap-2">
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
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente a sala e todos os patrimônios associados a ela.
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
        title="Salas"
        addLabel="Cadastrar Sala"
        onAdd={handleAdd}
        onSearch={setSearchQuery}
        searchPlaceholder="Pesquisar salas..."
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Editar Sala" : "Cadastrar Sala"}</DialogTitle>
          </DialogHeader>
          <RoomForm onSubmit={handleFormSubmit} defaultValues={editingRoom} sectors={sectors} />
        </DialogContent>
      </Dialog>
      
      <DataTable
        columns={columns}
        data={filteredRooms}
        emptyStateMessage="Carregando..."
      />
    </div>
  );
}
