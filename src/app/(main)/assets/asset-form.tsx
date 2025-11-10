
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Block, Sector, Room, Asset, assetStatusOptions } from "@/lib/types";
import { useEffect, useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  roomId: z.string({ required_error: "Selecione uma sala." }),
  status: z.enum(assetStatusOptions, { required_error: "Selecione um status." }),
});

type AssetFormValues = z.infer<typeof formSchema>;

type AssetFormProps = {
  onSubmit: (values: AssetFormValues) => void;
  defaultValues?: Partial<Asset>;
  blocks: Block[];
  allSectors: Sector[];
  allRooms: Room[];
};

export function AssetForm({ onSubmit, defaultValues, blocks, allSectors, allRooms }: AssetFormProps) {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const [availableSectors, setAvailableSectors] = useState<Sector[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  
  const isEditing = !!defaultValues?.id;

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      roomId: defaultValues?.roomId || "",
      status: defaultValues?.status || "Em Uso",
    },
  });

  // Effect to populate location fields when editing an asset
  useEffect(() => {
    if (isEditing && defaultValues?.roomId) {
      const room = allRooms.find(r => r.id === defaultValues.roomId);
      if (room) {
        const sector = allSectors.find(s => s.id === room.sectorId);
        if (sector) {
          setSelectedBlock(sector.blockId);
          setSelectedSector(sector.id);
          setAvailableSectors(allSectors.filter(s => s.blockId === sector.blockId));
          setAvailableRooms(allRooms.filter(r => r.sectorId === sector.id));
          form.setValue('roomId', room.id);
        }
      }
    }
  }, [isEditing, defaultValues, allRooms, allSectors, form]);

  // Effect to update available sectors when block changes
  useEffect(() => {
    if (selectedBlock && !isEditing) {
      setAvailableSectors(allSectors.filter(s => s.blockId === selectedBlock));
      setSelectedSector(null);
      form.setValue('roomId', '');
    }
  }, [selectedBlock, allSectors, form, isEditing]);
  
  // Effect to update available rooms when sector changes
  useEffect(() => {
    if (selectedSector && !isEditing) {
      setAvailableRooms(allRooms.filter(r => r.sectorId === selectedSector));
       form.setValue('roomId', '');
    }
  }, [selectedSector, allRooms, form, isEditing]);


  const handleBlockChange = (blockId: string) => {
    if (!isEditing) {
        setSelectedBlock(blockId);
    }
  }

  const handleSectorChange = (sectorId: string) => {
    if (!isEditing) {
        setSelectedSector(sectorId);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Patrimônio</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Cadeira Gamer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assetStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
             <FormItem>
              <FormLabel>Bloco</FormLabel>
              <Select onValueChange={handleBlockChange} value={selectedBlock ?? ""} disabled={isEditing}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isEditing ? blocks.find(b => b.id === selectedBlock)?.name : 'Selecione um bloco'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {blocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel>Setor</FormLabel>
              <Select onValueChange={handleSectorChange} value={selectedSector ?? ""} disabled={isEditing || !selectedBlock}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isEditing ? allSectors.find(s => s.id === selectedSector)?.name : 'Selecione um setor'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableSectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormField
            control={form.control}
            name="roomId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Sala</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEditing || !selectedSector}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={isEditing ? allRooms.find(r => r.id === field.value)?.name : 'Selecione uma sala'} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                        {room.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  );
}
