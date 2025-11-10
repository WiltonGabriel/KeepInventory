'use client';

import { Palette, Text, ZoomIn, ZoomOut, Rocket, Building, Building2, DoorOpen } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const [activeColor, setActiveColor] = useState('206 100% 24%');

  const handleColorChange = (color: string) => {
    const root = document.documentElement;
    const [h, s] = color.split(' ').map(parseFloat);

    const lightColor = color;
    const darkColor = `${h} ${s}% 70%`; // Aumenta a luminosidade para o modo escuro

    root.style.setProperty('--primary-light', lightColor);
    root.style.setProperty('--primary-dark', darkColor);
    setActiveColor(color);
  };
  
  const changeFontSize = (direction: 'increase' | 'decrease') => {
    const root = document.documentElement;
    const currentMultiplier = parseFloat(getComputedStyle(root).getPropertyValue('--font-size-multiplier').trim());
    let newMultiplier;

    if (direction === 'increase') {
      newMultiplier = Math.min(currentMultiplier + 0.1, 1.5); // Limite máximo de 150%
    } else {
      newMultiplier = Math.max(currentMultiplier - 0.1, 0.8); // Limite mínimo de 80%
    }
    
    root.style.setProperty('--font-size-multiplier', newMultiplier.toString());
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>

        <Alert>
          <Rocket className="h-4 w-4" />
          <AlertTitle>Dica Rápida!</AlertTitle>
          <AlertDescription>
            A gestão da hierarquia do inventário (Blocos, Setores e Salas) e dos prefixos de patrimônio é realizada em suas respectivas páginas. Use os links abaixo para navegar.
            <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" asChild><Link href="/blocks"><Building className="mr-2 h-4 w-4"/> Blocos</Link></Button>
                <Button variant="outline" size="sm" asChild><Link href="/sectors"><Building2 className="mr-2 h-4 w-4"/> Setores</Link></Button>
                <Button variant="outline" size="sm" asChild><Link href="/rooms"><DoorOpen className="mr-2 h-4 w-4"/> Salas</Link></Button>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
            <CardHeader>
                <CardTitle>Aparência e Acessibilidade</CardTitle>
                <CardDescription>Personalize a identidade visual e a acessibilidade da aplicação.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2"><Palette className="h-5 w-5"/> Cor Principal do Sistema</h3>
                    <p className="text-sm text-muted-foreground mb-4">Selecione a cor principal. A alteração é aplicada em tempo real e afeta vários componentes da interface.</p>
                    <div className="flex flex-wrap gap-2">
                         <Button onClick={() => handleColorChange('206 100% 24%')} style={{backgroundColor: 'hsl(206, 100%, 24%)'}} className={`w-10 h-10 rounded-full border-2 ${activeColor === '206 100% 24%' ? 'border-ring' : 'border-transparent'}`} aria-label="Azul Padrão"/>
                         <Button onClick={() => handleColorChange('347 77% 50%')} style={{backgroundColor: 'hsl(347, 77%, 50%)'}} className={`w-10 h-10 rounded-full border-2 ${activeColor === '347 77% 50%' ? 'border-ring' : 'border-transparent'}`} aria-label="Vermelho"/>
                         <Button onClick={() => handleColorChange('142 76% 36%')} style={{backgroundColor: 'hsl(142, 76%, 36%)'}} className={`w-10 h-10 rounded-full border-2 ${activeColor === '142 76% 36%' ? 'border-ring' : 'border-transparent'}`} aria-label="Verde"/>
                         <Button onClick={() => handleColorChange('256 64% 52%')} style={{backgroundColor: 'hsl(256, 64%, 52%)'}} className={`w-10 h-10 rounded-full border-2 ${activeColor === '256 64% 52%' ? 'border-ring' : 'border-transparent'}`} aria-label="roxo"/>
                         <Button onClick={() => handleColorChange('24 94% 51%')} style={{backgroundColor: 'hsl(24, 94%, 51%)'}} className={`w-10 h-10 rounded-full border-2 ${activeColor === '24 94% 51%' ? 'border-ring' : 'border-transparent'}`} aria-label="Laranja"/>
                         <Button onClick={() => handleColorChange('275 84% 30%')} style={{backgroundColor: 'hsl(275, 84%, 30%)'}} className={`w-10 h-10 rounded-full border-2 ${activeColor === '275 84% 30%' ? 'border-ring' : 'border-transparent'}`} aria-label="Roxo Escuro"/>
                    </div>
                </div>

                <Separator />

                 <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2"><Text className="h-5 w-5"/> Tamanho da Fonte</h3>
                    <p className="text-sm text-muted-foreground mb-4">Ajuste o tamanho do texto em toda a aplicação para melhor legibilidade.</p>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => changeFontSize('decrease')} variant="outline" size="icon" aria-label="Diminuir fonte">
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">A</span>
                        <Button onClick={() => changeFontSize('increase')} variant="outline" size="icon" aria-label="Aumentar fonte">
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

            </CardContent>
        </Card>
    </div>
  );
}
