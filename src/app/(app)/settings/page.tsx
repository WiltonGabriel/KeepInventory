'use client';

import { AlertCircle, Palette, User, ShieldAlert, Building, Building2, DoorOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SettingsPage() {
  
  const handleColorChange = (color: string) => {
    document.documentElement.style.setProperty('--primary', color);
  };


  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <User className="mr-2 h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" /> Aparência
          </TabsTrigger>
          <TabsTrigger value="danger-zone">
            <ShieldAlert className="mr-2 h-4 w-4" /> Zona de Perigo
          </TabsTrigger>
        </TabsList>
        
        <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">Aviso Importante</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            A gestão da hierarquia do inventário (Blocos, Setores e Salas) e dos prefixos de patrimônio é realizada em suas respectivas páginas. Use os links abaixo para navegar.
            <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" asChild><Link href="/blocks"><Building className="mr-2 h-4 w-4"/> Blocos</Link></Button>
                <Button variant="outline" size="sm" asChild><Link href="/sectors"><Building2 className="mr-2 h-4 w-4"/> Setores</Link></Button>
                <Button variant="outline" size="sm" asChild><Link href="/rooms"><DoorOpen className="mr-2 h-4 w-4"/> Salas</Link></Button>
            </div>
          </AlertDescription>
        </Alert>

        <TabsContent value="users">
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                    <CardDescription>Esta funcionalidade requer um ambiente de servidor seguro (backend) para ser implementada e não está disponível na versão atual.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">O gerenciamento de usuários e permissões (roles) precisa do Firebase Admin SDK, que não pode ser executado de forma segura no navegador do cliente. A implementação futura desta funcionalidade exigirá a criação de uma API de backend.</p>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="appearance">
            <Card>
                <CardHeader>
                    <CardTitle>Aparência</CardTitle>
                    <CardDescription>Personalize a identidade visual da aplicação.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium mb-2">Cor Primária</h3>
                        <p className="text-sm text-muted-foreground mb-4">Selecione a cor principal do sistema. A alteração é aplicada em tempo real.</p>
                        <div className="flex gap-2">
                             <Button onClick={() => handleColorChange('206 100% 24%')} style={{backgroundColor: 'hsl(206, 100%, 24%)'}} className="w-10 h-10 rounded-full border-2 border-transparent focus:border-ring" aria-label="Azul Padrão"/>
                             <Button onClick={() => handleColorChange('347 77% 50%')} style={{backgroundColor: 'hsl(347, 77%, 50%)'}} className="w-10 h-10 rounded-full border-2 border-transparent focus:border-ring" aria-label="Vermelho"/>
                             <Button onClick={() => handleColorChange('142 76% 36%')} style={{backgroundColor: 'hsl(142, 76%, 36%)'}} className="w-10 h-10 rounded-full border-2 border-transparent focus:border-ring" aria-label="Verde"/>
                             <Button onClick={() => handleColorChange('256 64% 52%')} style={{backgroundColor: 'hsl(256, 64%, 52%)'}} className="w-10 h-10 rounded-full border-2 border-transparent focus:border-ring" aria-label="Roxo"/>
                             <Button onClick={() => handleColorChange('24 94% 51%')} style={{backgroundColor: 'hsl(24, 94%, 51%)'}} className="w-10 h-10 rounded-full border-2 border-transparent focus:border-ring" aria-label="Laranja"/>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="danger-zone">
             <Card>
                <CardHeader>
                    <CardTitle>Zona de Perigo</CardTitle>
                    <CardDescription>Ações destrutivas que não podem ser desfeitas. Esta funcionalidade requer um backend e não está disponível.</CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground">Ações como "Resetar Inventário" ou "Reset de Fábrica" são operações críticas que devem ser executadas em um ambiente de servidor seguro para garantir a integridade dos dados e evitar exclusões acidentais em massa pelo cliente.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
