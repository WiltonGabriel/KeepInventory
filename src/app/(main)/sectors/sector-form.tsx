
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
import { Block, Sector } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  abbreviation: z.string().length(3, { message: "A sigla deve ter exatamente 3 caracteres." }).transform(val => val.toUpperCase()),
  blockId: z.string({ required_error: "Selecione um bloco." }),
});

type SectorFormProps = {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  defaultValues?: Partial<Sector>;
  blocks: Block[];
};

export function SectorForm({ onSubmit, defaultValues, blocks }: SectorFormProps) {
  const isEditing = !!defaultValues;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", abbreviation: "", blockId: "", ...defaultValues },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Setor</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Tecnologia da Informação" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="abbreviation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sigla (3 letras)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: TIN" {...field} maxLength={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="blockId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bloco</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  );
}
