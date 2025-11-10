
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
import { Block, Sector, Room, Asset, assetStatusOptions, AssetStatus } from "@/lib/types";
import { useEffect, useState } from "react";
import { inventoryService } from "@/lib/data";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  roomId: z.string({ required_error: "Selecione uma sala." }),
  status: z.enum(assetStatusOptions, { required_error: "Selecione um status." }),
});

type AssetFormProps = {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
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
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", roomId: "", status: "Em Uso", ...defaultValues },
  });

  useEffect(() => {
    if (defaultValues?.roomId) {
        const room = inventoryService.getById('rooms', defaultValues.roomId) as Room;
        if (room) {
            const sector = inventoryService.getById('sectors', room.sectorId) as Sector;
            if (sector) {
                setSelectedBlock(sector.blockId);
                setSelectedSector(sector.id);
                form.setValue('roomId', room.id);
            }
        }
    }
  }, [defaultValues, form]);


  useEffect(() => {
    if (selectedBlock) {
      setAvailableSectors(inventoryService.getSectorsByBlockId(selectedBlock));
    } else {
      setAvailableSectors([]);
    }
    form.setValue('roomId', '');
    setSelectedSector(null);
  }, [selectedBlock, form, allSectors]);

  useEffect(() => {
    if (selectedSector) {
      setAvailableRooms(inventoryService.getRoomsBySectorId(selectedSector));
    } else {
      setAvailableRooms([]);
    }
     form.setValue('roomId', '');
  }, [selectedSector, form, allRooms]);

  const handleBlockChange = (blockId: string) => {
    setSelectedBlock(blockId);
    setSelectedSector(null);
    form.setValue('roomId', '');
  }

  const handleSectorChange = (sectorId: string) => {
    setSelectedSector(sectorId);
    form.setValue('roomId', '');
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
              <Select onValueChange={handleBlockChange} value={selectedBlock ?? undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um bloco" />
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
              <Select onValueChange={handleSectorChange} value={selectedSector ?? undefined} disabled={!selectedBlock}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
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
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!selectedSector}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione uma sala" />
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
