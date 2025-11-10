
"use client";

import { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/lib/data";
import { Sector, Block } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HardConfirmationDialog } from "@/components/ui/hard-confirmation-dialog";
import { SectorForm } from "./sector-form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function SectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | undefined>(undefined);
  const { toast } = useToast();

  const loadData = () => {
    setSectors(inventoryService.getAll("sectors") as Sector[]);
    setBlocks(inventoryService.getAll("blocks") as Block[]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingSector(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (sector: Sector) => {
    setEditingSector(sector);
    setIsFormOpen(true);
  };
  
  const handleDelete = (id: string) => {
    inventoryService.delete("sectors", id);
    loadData();
    toast({ title: "Setor removido", description: "O setor e seus itens associados foram removidos." });
  };

  const handleFormSubmit = (values: Omit<Sector, 'id'>) => {
    if (editingSector) {
      inventoryService.update("sectors", { ...editingSector, ...values });
      toast({ title: "Setor atualizado", description: "As informações do setor foram salvas." });
    } else {
      inventoryService.add("sectors", values);
      toast({ title: "Setor adicionado", description: "Um novo setor foi criado com sucesso." });
    }
    loadData();
    setIsFormOpen(false);
    setEditingSector(undefined);
  };

  const getBlockName = (blockId: string) => {
    return blocks.find(b => b.id === blockId)?.name || 'N/A';
  }

  const filteredSectors = useMemo(() => {
    return sectors.filter((sector) =>
      sector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getBlockName(sector.blockId).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sectors, searchQuery, blocks]);

  const columns = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }: { row: { original: Sector } }) => row.original.name,
    },
    {
      accessorKey: "abbreviation",
      header: "Sigla",
      cell: ({ row }: { row: { original: Sector } }) => <Badge variant="secondary">{row.original.abbreviation}</Badge>,
    },
    {
      accessorKey: "block",
      header: "Bloco",
      cell: ({ row }: { row: { original: Sector } }) => getBlockName(row.original.blockId),
    },
    {
      accessorKey: "actions",
      header: "Ações",
      cell: ({ row }: { row: { original: Sector } }) => (
        <div className="flex gap-2">
          <HardConfirmationDialog
            trigger={
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            }
            title="Confirmar Edição"
            description="Para prosseguir com a edição, por favor, digite o nome do setor:"
            itemName={row.original.name}
            onConfirm={() => openEditForm(row.original)}
            confirmButtonText="Confirmar e Editar"
          />

          <HardConfirmationDialog
            trigger={
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title="Você tem certeza?"
            description="Esta ação não pode ser desfeita. Isso excluirá permanentemente o setor e todas as salas e patrimônios associados a ele. Para confirmar, digite:"
            itemName={row.original.name}
            onConfirm={() => handleDelete(row.original.id)}
            confirmButtonText="Eu entendo as consequências, apagar este Setor"
            variant="destructive"
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Setores"
        addLabel="Cadastrar Setor"
        onAdd={handleAdd}
        onSearch={setSearchQuery}
        searchPlaceholder="Pesquisar setores..."
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => { if(!open) setEditingSector(undefined); setIsFormOpen(open);}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSector ? "Editar Setor" : "Cadastrar Setor"}</DialogTitle>
          </DialogHeader>
          <SectorForm onSubmit={handleFormSubmit} defaultValues={editingSector} blocks={blocks} />
        </DialogContent>
      </Dialog>
      
      <DataTable
        columns={columns}
        data={filteredSectors}
        emptyStateMessage="Nenhum setor encontrado."
      />
    </div>
  );
}
