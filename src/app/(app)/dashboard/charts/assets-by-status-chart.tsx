
"use client";

import { useMemo } from 'react';
import { Asset, assetStatusOptions } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from '@/components/ui/skeleton';

interface AssetsByStatusChartProps {
    assets: Asset[];
    isLoading: boolean;
}

const COLORS = {
  "Em Uso": "#22c55e",       // green-500
  "Guardado": "#f59e0b",   // amber-500
  "Perdido": "#ef4444",    // red-500
  "Desconhecido": "#6b7280", // gray-500
};

export function AssetsByStatusChart({ assets, isLoading }: AssetsByStatusChartProps) {
  const chartData = useMemo(() => {
    if (!assets) return [];
    
    const statusCounts = assetStatusOptions.reduce((acc, status) => {
        acc[status] = 0;
        return acc;
    }, {} as Record<Asset["status"], number>);

    assets.forEach(asset => {
        if (asset.status in statusCounts) {
            statusCounts[asset.status]++;
        }
    });

    return assetStatusOptions.map(status => ({
        name: status,
        value: statusCounts[status],
    })).filter(item => item.value > 0);
  }, [assets]);
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex justify-center items-center">
                 <Skeleton className="h-[250px] w-[250px] rounded-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patrimônios por Status</CardTitle>
        <CardDescription>Distribuição dos itens com base no seu status atual.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} ite${Number(value) > 1 ? 'ns' : 'm'}`, 'Total']}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                Nenhum patrimônio encontrado para exibir o gráfico.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
