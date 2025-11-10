
'use client';

import { useState, useMemo, useEffect }from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Block, Room, Sector, Asset } from '@/lib/types';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight } from 'lucide-react';

export default function MoveAssetsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  // Firestore collections
  const assetsCollection = useMemoFirebase(() => firestore ? collection(firestore, "patrimonios") : null, [firestore]);
  const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, "salas") : null, [firestore]);
  const sectorsCollection = useMemoFirebase(() => firestore ? collection(firestore, "setores") : null, [firestore]);
  const blocksCollection = useMemoFirebase(() => firestore ? collection(firestore, "blocos") : null, [firestore]);
  const generalLogCollection = useMemoFirebase(() => firestore ? collection(firestore, "log_geral") : null, [firestore]);

  // Data fetching
  const { data: allAssets, isLoading: isLoadingAssets } = useCollection<Asset>(assetsCollection);
  const { data: allRooms, isLoading: isLoadingRooms } = useCollection<Room>(roomsCollection);
  const { data: allSectors, isLoading: isLoadingSectors } = useCollection<Sector>(sectorsCollection);
  const { data: allBlocks, isLoading: isLoadingBlocks } = useCollection<Block>(blocksCollection);
  
  // State for origin panel
  const [originBlockId, setOriginBlockId] = useState<string | null>(null);
  const [originSectorId, setOriginSectorId] = useState<string | null>(null);
  const [originRoomId, setOriginRoomId] = useState<string | null>(null);

  // State for destination panel
  const [destBlockId, setDestBlockId] = useState<string | null>(null);
  const [destSectorId, setDestSectorId] = useState<string | null>(null);
  const [destRoomId, setDestRoomId] = useState<string | null>(null);

  // State for asset selection
  const [assetsInOrigin, setAssetsInOrigin] = useState<Asset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

  // Reset dependent dropdowns on change
  useEffect(() => { setOriginSectorId(null); setOriginRoomId(null); }, [originBlockId]);
  useEffect(() => { setOriginRoomId(null); }, [originSectorId]);
  useEffect(() => { setDestSectorId(null); setDestRoomId(null); }, [destBlockId]);
  useEffect(() => { setDestRoomId(null); }, [destSectorId]);
  
  // Update asset list when origin room changes
  useEffect(() => {
    if (originRoomId && allAssets) {
      setAssetsInOrigin(allAssets.filter(asset => asset.roomId === originRoomId));
    } else {
      setAssetsInOrigin([]);
    }
    setSelectedAssetIds(new Set()); // Clear selection when room changes
  }, [originRoomId, allAssets]);

  // Memoized lists for dependent dropdowns
  const originSectors = useMemo(() => allSectors?.filter(s => s.blockId === originBlockId) || [], [originBlockId, allSectors]);
  const originRooms = useMemo(() => allRooms?.filter(r => r.sectorId === originSectorId) || [], [originSectorId, allRooms]);
  const destSectors = useMemo(() => allSectors?.filter(s => s.blockId === destBlockId) || [], [destBlockId, allSectors]);
  const destRooms = useMemo(() => allRooms?.filter(r => r.sectorId === destSectorId) || [], [destSectorId, allRooms]);

  const handleAssetSelection = (assetId: string, checked: boolean) => {
    const newSelection = new Set(selectedAssetIds);
    if (checked) {
      newSelection.add(assetId);
    } else {
      newSelection.delete(assetId);
    }
    setSelectedAssetIds(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(assetsInOrigin.map(a => a.id));
      setSelectedAssetIds(allIds);
    } else {
      setSelectedAssetIds(new Set());
    }
  };

  const handleConfirmMove = async () => {
    if (!firestore || !destRoomId || selectedAssetIds.size === 0) {
      toast({
        variant: 'destructive',
        title: 'Movimentação Inválida',
        description: 'Selecione os itens para mover e a sala de destino.',
      });
      return;
    }
    
    if (originRoomId === destRoomId) {
       toast({
        variant: 'destructive',
        title: 'Movimentação Inválida',
        description: 'A sala de origem e destino não podem ser a mesma.',
      });
      return;
    }

    const batch = writeBatch(firestore);
    const originRoomName = allRooms?.find(r => r.id === originRoomId)?.name || 'N/A';
    const destRoomName = allRooms?.find(r => r.id === destRoomId)?.name || 'N/A';

    for (const assetId of selectedAssetIds) {
      const assetRef = doc(firestore, 'patrimonios', assetId);
      const asset = allAssets?.find(a => a.id === assetId);
      if (!asset) continue;

      // 1. Update the asset's roomId
      batch.update(assetRef, { roomId: destRoomId });

      // 2. Log to specific history
      const specificLogRef = doc(collection(firestore, 'patrimonios', assetId, 'log_especifico'));
      batch.set(specificLogRef, {
        action: 'Movido',
        from: originRoomName,
        to: destRoomName,
        assetNameSnapshot: asset.name,
        timestamp: serverTimestamp(),
      });

      // 3. Log to general log
      if(generalLogCollection) {
        const generalLogRef = doc(generalLogCollection);
        batch.set(generalLogRef, {
            acao: `Patrimônio "${asset.name}" (${asset.id}) movido para "${destRoomName}".`,
            timestamp: serverTimestamp() 
        });
      }
    }

    try {
      await batch.commit();
      toast({
        title: 'Sucesso!',
        description: `${selectedAssetIds.size} ite${selectedAssetIds.size > 1 ? 'ns' : 'm'} movido${selectedAssetIds.size > 1 ? 's' : ''} para "${destRoomName}".`,
      });
      // Reset state
      setOriginRoomId(null);
      setDestRoomId(null);
      setOriginSectorId(null);
      setDestSectorId(null);
      setOriginBlockId(null);
      setDestBlockId(null);

    } catch (error) {
      console.error("Error moving assets: ", error);
       toast({
        variant: 'destructive',
        title: 'Erro ao Mover',
        description: 'Não foi possível completar a movimentação. Verifique as permissões.',
      });
    }
  };

  const isLoading = isLoadingAssets || isLoadingRooms || isLoadingSectors || isLoadingBlocks;

  return (
    <div className="flex flex-col gap-8">
       <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Movimentar Patrimônios</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Origin Panel */}
            <Card>
                <CardHeader>
                    <CardTitle>Painel de Origem</CardTitle>
                    <CardDescription>Selecione a localização atual e os itens que deseja mover.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select onValueChange={setOriginBlockId} value={originBlockId || ''}>
                        <SelectTrigger><SelectValue placeholder="Selecione um Bloco" /></SelectTrigger>
                        <SelectContent>
                            {allBlocks?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select onValueChange={setOriginSectorId} value={originSectorId || ''} disabled={!originBlockId}>
                        <SelectTrigger><SelectValue placeholder="Selecione um Setor" /></SelectTrigger>
                        <SelectContent>
                            {originSectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select onValueChange={setOriginRoomId} value={originRoomId || ''} disabled={!originSectorId}>
                        <SelectTrigger><SelectValue placeholder="Selecione uma Sala" /></SelectTrigger>
                        <SelectContent>
                            {originRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    {originRoomId && (
                      <div className='border rounded-lg mt-4'>
                          <div className='p-4 border-b flex items-center space-x-2'>
                              <Checkbox 
                                id="select-all" 
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                checked={assetsInOrigin.length > 0 && selectedAssetIds.size === assetsInOrigin.length}
                                disabled={assetsInOrigin.length === 0}
                              />
                              <Label htmlFor='select-all' className='font-semibold'>
                                {assetsInOrigin.length === 0 ? 'Nenhum item nesta sala' : 'Selecionar Todos'}
                              </Label>
                          </div>
                          <ScrollArea className="h-64">
                              <div className="p-4 space-y-2">
                                  {assetsInOrigin.map(asset => (
                                    <div key={asset.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                      <Checkbox 
                                        id={`asset-${asset.id}`} 
                                        onCheckedChange={(checked) => handleAssetSelection(asset.id, !!checked)}
                                        checked={selectedAssetIds.has(asset.id)}
                                      />
                                      <Label htmlFor={`asset-${asset.id}`} className='flex-1 cursor-pointer'>
                                        {asset.name} <span className='text-xs text-muted-foreground'>({asset.id})</span>
                                      </Label>
                                    </div>
                                  ))}
                              </div>
                          </ScrollArea>
                      </div>
                    )}
                </CardContent>
            </Card>

            {/* Destination Panel */}
            <Card>
                <CardHeader>
                    <CardTitle>Painel de Destino</CardTitle>
                    <CardDescription>Selecione a nova localização para os itens selecionados.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Select onValueChange={setDestBlockId} value={destBlockId || ''}>
                        <SelectTrigger><SelectValue placeholder="Selecione um Bloco" /></SelectTrigger>
                        <SelectContent>
                            {allBlocks?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select onValueChange={setDestSectorId} value={destSectorId || ''} disabled={!destBlockId}>
                        <SelectTrigger><SelectValue placeholder="Selecione um Setor" /></SelectTrigger>
                        <SelectContent>
                            {destSectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select onValueChange={setDestRoomId} value={destRoomId || ''} disabled={!destSectorId}>
                        <SelectTrigger><SelectValue placeholder="Selecione uma Sala" /></SelectTrigger>
                        <SelectContent>
                            {destRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>
        
        <div className="flex justify-center pt-4">
            <Button 
                onClick={handleConfirmMove} 
                disabled={selectedAssetIds.size === 0 || !destRoomId || isLoading}
                size="lg"
            >
                Confirmar Movimentação ({selectedAssetIds.size} {selectedAssetIds.size === 1 ? 'item' : 'itens'})
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </div>
    </div>
  );
}
