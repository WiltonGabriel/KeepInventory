
'use client';

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
import { useEffect, useMemo } from "react";

// O schema para validação do formulário. Inclui os IDs de localização para controle.
const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  status: z.enum(assetStatusOptions, { required_error: "Selecione um status." }),
  blockId: z.string({ required_error: "Selecione um bloco." }).min(1, {message: "Selecione um bloco."}),
  sectorId: z.string({ required_error: "Selecione um setor." }).min(1, {message: "Selecione um setor."}),
  roomId: z.string({ required_error: "Selecione uma sala." }).min(1, { message: "Selecione uma sala." }),
});

// Tipagem inferida do schema Zod.
type AssetFormValues = z.infer<typeof formSchema>;

type AssetFormProps = {
  // A função onSubmit recebe apenas os dados pertinentes à entidade Asset.
  onSubmit: (values: Omit<AssetFormValues, 'blockId' | 'sectorId'>) => void;
  defaultValues?: Partial<Asset>;
  blocks: Block[];
  allSectors: Sector[];
  allRooms: Room[];
};

export function AssetForm({ onSubmit, defaultValues, blocks, allSectors, allRooms }: AssetFormProps) {
  
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(formSchema),
    // Define os valores padrão para o modo de criação.
    defaultValues: {
      name: "",
      status: "Em Uso",
      blockId: "",
      sectorId: "",
      roomId: "",
    },
  });

  // Este useEffect é a chave para preencher o formulário no modo de edição.
  useEffect(() => {
    // Só executa se estiver editando (defaultValues existe) e todos os dados de localização estiverem carregados.
    if (defaultValues?.id && allRooms.length > 0 && allSectors.length > 0 && blocks.length > 0) {
      
      const room = allRooms.find(r => r.id === defaultValues.roomId);
      if (room) {
        const sector = allSectors.find(s => s.id === room.sectorId);
        // Apenas se a hierarquia completa (sala e setor) for encontrada, o formulário é preenchido.
        if (sector) {
          // form.reset() atualiza o estado interno completo do formulário, limpando erros de validação anteriores.
          form.reset({
            name: defaultValues.name || "",
            status: defaultValues.status || "Em Uso",
            blockId: sector.blockId,
            sectorId: sector.id,
            roomId: room.id,
          });
        }
      }
    }
  // A lista de dependências garante que o efeito seja reavaliado se qualquer um dos dados mudar.
  }, [defaultValues, allRooms, allSectors, blocks, form]);
  
  // Observadores para os campos de seleção, para filtrar as opções dinamicamente.
  const watchedBlockId = form.watch("blockId");
  const watchedSectorId = form.watch("sectorId");

  // Filtra os setores disponíveis com base no bloco selecionado.
  const availableSectors = useMemo(() => {
    if (!watchedBlockId) return [];
    return allSectors.filter(s => s.blockId === watchedBlockId);
  }, [watchedBlockId, allSectors]);

  // Filtra as salas disponíveis com base no setor selecionado.
  const availableRooms = useMemo(() => {
    if (!watchedSectorId) return [];
    return allRooms.filter(r => r.sectorId === watchedSectorId);
  }, [watchedSectorId, allRooms]);

  // Handler para o submit que remove os campos auxiliares (blockId, sectorId) antes de enviar.
  const handleFormSubmit = (values: AssetFormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { blockId, sectorId, ...submissionValues } = values;
    onSubmit(submissionValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
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
              <Select onValueChange={field.onChange} value={field.value}>
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
             <FormField
              control={form.control}
              name="blockId"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Bloco</FormLabel>
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        // Limpa os campos dependentes para forçar uma nova seleção.
                        form.setValue('sectorId', '', { shouldValidate: true });
                        form.setValue('roomId', '', { shouldValidate: true });
                    }} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={'Selecione um bloco'} />
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
                    <FormMessage />
                </FormItem>
              )}
             />
            
            <FormField
              control={form.control}
              name="sectorId"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Setor</FormLabel>
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        // Limpa o campo dependente.
                        form.setValue('roomId', '', { shouldValidate: true });
                    }} value={field.value} disabled={!watchedBlockId || availableSectors.length === 0}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={!watchedBlockId ? 'Selecione um bloco primeiro' : 'Selecione um setor'} />
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
                    <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Sala</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!watchedSectorId || availableRooms.length === 0}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder={!watchedSectorId ? 'Selecione um setor primeiro' : 'Selecione uma sala'} />
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
