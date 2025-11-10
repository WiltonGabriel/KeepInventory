
"use client";

import { useState, useMemo } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { collection, doc } from "firebase/firestore";
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
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function BlocksPage() {
  const firestore = useFirestore();
  const { data: blocks, isLoading } = useCollection<Block>(
    useMemo(() => collection(firestore, "blocks"), [firestore])
  );
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | undefined>(undefined);
  const { toast } = useToast();


  const handleAdd = () => {
    setEditingBlock(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (block: Block) => {
    setEditingBlock(block);
    setIsFormOpen(true);
  };
  
  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "blocks", id));
    toast({ title: "Bloco removido", description: "O bloco foi removido com sucesso." });
  };

  const handleFormSubmit = (values: { name: string }) => {
    if (!firestore) return;
    if (editingBlock) {
      updateDocumentNonBlocking(doc(firestore, "blocks", editingBlock.id), values);
      toast({ title: "Bloco atualizado", description: "As informações do bloco foram salvas." });
    } else {
      addDocumentNonBlocking(collection(firestore, "blocks"), values);
      toast({ title: "Bloco adicionado", description: "Um novo bloco foi criado com sucesso." });
    }
    setIsFormOpen(false);
    setEditingBlock(undefined);
  };

  const filteredBlocks = useMemo(() => {
    if (!blocks) return [];
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
            description="Esta ação não pode ser desfeita. Isso excluirá permanentemente o bloco. Para confirmar, digite:"
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
        emptyStateMessage={isLoading ? "Carregando..." : "Nenhum bloco encontrado."}
      />
    </div>
  );
}
