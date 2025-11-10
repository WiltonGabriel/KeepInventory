
'use client';

import { useState, useMemo } from 'react';
import { Sector, Block } from '@/lib/types';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HardConfirmationDialog } from '@/components/ui/hard-confirmation-dialog';
import { SectorForm } from './sector-form'; // Renomeado de ../sectors/sector-form
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const firestore = useFirestore();
  const sectorsCollection = useMemoFirebase(() => collection(firestore, 'setores'), [firestore]);
  const blocksCollection = useMemoFirebase(() => collection(firestore, 'blocos'), [firestore]);

  const { data: sectors, isLoading: isLoadingSectors } = useCollection<Sector>(sectorsCollection);
  const { data: blocks, isLoading: isLoadingBlocks } = useCollection<Block>(blocksCollection);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | undefined>(undefined);
  const { toast } = useToast();

  const handleAdd = () => {
    setEditingSector(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (sector: Sector) => {
    setEditingSector(sector);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    // TODO: Consider cascading deletes for rooms and assets within this sector.
    deleteDocumentNonBlocking(doc(firestore, 'setores', id));
    toast({ title: 'Setor removido', description: 'O setor foi removido com sucesso.' });
  };

  const handleFormSubmit = (values: Omit<Sector, 'id'>) => {
    if (!firestore) return;
    if (editingSector) {
      updateDocumentNonBlocking(doc(firestore, 'setores', editingSector.id), values);
      toast({ title: 'Setor atualizado', description: 'As informações do setor foram salvas.' });
    } else {
      addDocumentNonBlocking(collection(firestore, 'setores'), values);
      toast({ title: 'Setor adicionado', description: 'Um novo setor foi criado com sucesso.' });
    }
    setIsFormOpen(false);
    setEditingSector(undefined);
  };

  const getBlockName = (blockId: string) => {
    return blocks?.find((b) => b.id === blockId)?.name || 'N/A';
  };

  const filteredSectors = useMemo(() => {
    if (!sectors) return [];
    return sectors.filter(
      (sector) =>
        sector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getBlockName(sector.blockId).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sectors, searchQuery, blocks]);

  const isLoading = isLoadingSectors || isLoadingBlocks;

  const columns = [
    {
      accessorKey: 'name',
      header: 'Nome do Setor',
      cell: ({ row }: { row: { original: Sector } }) => row.original.name,
    },
    {
      accessorKey: 'abbreviation',
      header: 'Prefixo (Sigla)',
      cell: ({ row }: { row: { original: Sector } }) => <Badge variant="secondary">{row.original.abbreviation}</Badge>,
    },
    {
      accessorKey: 'block',
      header: 'Bloco',
      cell: ({ row }: { row: { original: Sector } }) => getBlockName(row.original.blockId),
    },
    {
      accessorKey: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: { original: Sector } }) => (
        <div className="flex gap-2">
           <Button variant="outline" size="icon" onClick={() => openEditForm(row.original)}>
                <Edit className="h-4 w-4" />
            </Button>

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
            confirmButtonText="Eu entendo, apagar este Setor"
            variant="destructive"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciador de Prefixos de Setor</CardTitle>
          <CardDescription>
            Defina e edite os setores e seus prefixos de 3 letras, que são usados para gerar os IDs dos patrimônios.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-end mb-4 gap-4">
                 <Input
                    type="search"
                    placeholder="Pesquisar setores..."
                    className="w-64"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    />
                <Button onClick={handleAdd} className="gap-2">
                    Adicionar Setor
                </Button>
            </div>
             <DataTable columns={columns} data={filteredSectors} emptyStateMessage={isLoading ? 'Carregando...' : 'Nenhum setor encontrado.'} />
        </CardContent>
      </Card>
      
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) setEditingSector(undefined);
          setIsFormOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSector ? 'Editar Setor' : 'Cadastrar Setor'}</DialogTitle>
          </DialogHeader>
          <SectorForm onSubmit={handleFormSubmit} defaultValues={editingSector} blocks={blocks || []} />
        </DialogContent>
      </Dialog>

    </div>
  );
}
