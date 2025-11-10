
"use client";

import { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/lib/data";
import { Block } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardConfirmationDialog } from "@/components/ui/hard-confirmation-dialog";
import { BlockForm } from "./block-form";
import { useToast } from "@/hooks/use-toast";

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | undefined>(undefined);
  const { toast } = useToast();

  const loadBlocks = () => {
    const allBlocks = inventoryService.getAll("blocks") as Block[];
    setBlocks(allBlocks);
  };

  useEffect(() => {
    loadBlocks();
  }, []);

  const handleAdd = () => {
    setEditingBlock(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (block: Block) => {
    setEditingBlock(block);
    setIsFormOpen(true);
  };
  
  const handleDelete = (id: string) => {
    inventoryService.delete("blocks", id);
    loadBlocks();
    toast({ title: "Bloco removido", description: "O bloco e seus itens associados foram removidos." });
  };

  const handleFormSubmit = (values: { name: string }) => {
    if (editingBlock) {
      inventoryService.update("blocks", { ...editingBlock, ...values });
      toast({ title: "Bloco atualizado", description: "As informações do bloco foram salvas." });
    } else {
      inventoryService.add("blocks", values);
      toast({ title: "Bloco adicionado", description: "Um novo bloco foi criado com sucesso." });
    }
    loadBlocks();
    setIsFormOpen(false);
    setEditingBlock(undefined);
  };

  const filteredBlocks = useMemo(() => {
    return blocks.filter((block) =>
      block.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [blocks, searchQuery]);

  const columns = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }: { row: { original: Block } }) => row.original.name,
    },
    {
      accessorKey: "actions",
      header: "Ações",
      cell: ({ row }: { row: { original: Block } }) => (
        <div className="flex gap-2">
           <HardConfirmationDialog
            trigger={
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            }
            title="Confirmar Edição"
            description="Para prosseguir com a edição, por favor, digite o nome do bloco:"
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
            description="Esta ação não pode ser desfeita. Isso excluirá permanentemente o bloco e todos os setores, salas e patrimônios associados a ele. Para confirmar, digite:"
            itemName={row.original.name}
            onConfirm={() => handleDelete(row.original.id)}
            confirmButtonText="Eu entendo as consequências, apagar este Bloco"
            variant="destructive"
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Blocos"
        addLabel="Cadastrar Bloco"
        onAdd={handleAdd}
        onSearch={setSearchQuery}
        searchPlaceholder="Pesquisar blocos..."
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => { if(!open) setEditingBlock(undefined); setIsFormOpen(open);}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBlock ? "Editar Bloco" : "Cadastrar Bloco"}</DialogTitle>
          </DialogHeader>
          <BlockForm onSubmit={handleFormSubmit} defaultValues={editingBlock} />
        </DialogContent>
      </Dialog>
      
      <DataTable
        columns={columns}
        data={filteredBlocks}
        emptyStateMessage="Nenhum bloco encontrado."
      />
    </div>
  );
}
