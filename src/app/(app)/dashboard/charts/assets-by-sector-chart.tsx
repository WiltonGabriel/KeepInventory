
"use client";

import { useMemo } from 'react';
import { Asset, Room, Sector } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from '@/components/ui/skeleton';

interface AssetsBySectorChartProps {
    assets: Asset[];
    rooms: Room[];
    sectors: Sector[];
    isLoading: boolean;
}

export function AssetsBySectorChart({ assets, rooms, sectors, isLoading }: AssetsBySectorChartProps) {

  const chartData = useMemo(() => {
    if (!assets || !rooms || !sectors || assets.length === 0 || rooms.length === 0 || sectors.length === 0) {
        return [];
    }

    const roomToSectorMap = rooms.reduce((acc, room) => {
        acc[room.id] = room.sectorId;
        return acc;
    }, {} as Record<string, string>);

    const sectorCounts = sectors.reduce((acc, sector) => {
        acc[sector.id] = { name: sector.name, value: 0 };
        return acc;
    }, {} as Record<string, {name: string, value: number}>);


    assets.forEach(asset => {
        const sectorId = roomToSectorMap[asset.roomId];
        if (sectorId && sectorCounts[sectorId]) {
            sectorCounts[sectorId].value++;
        }
    });

    return Object.values(sectorCounts).filter(sector => sector.value > 0);
  }, [assets, rooms, sectors]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="h-[250px]">
                 <Skeleton className="h-full w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total de Itens por Setor</CardTitle>
        <CardDescription>Contagem de patrimônios alocados em cada setor.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 20,
                left: -10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickSize={0} axisLine={false} tickMargin={10} />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value) => [`${value} ite${Number(value) > 1 ? 'ns' : 'm'}`, 'Total']}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Legend wrapperStyle={{paddingTop: '20px'}}/>
              <Bar dataKey="value" name="Patrimônios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
             <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                Dados insuficientes para exibir o gráfico de setores.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
