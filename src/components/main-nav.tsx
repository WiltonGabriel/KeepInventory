
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Archive,
  DoorOpen,
  Building2,
  Building,
  BarChart3,
  Settings,
  ArrowRightLeft,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/assets", label: "Patrimônios", icon: Archive },
  { href: "/move-assets", label: "Movimentação", icon: ArrowRightLeft },
  { href: "/rooms", label: "Salas", icon: DoorOpen },
  { href: "/sectors", label: "Setores", icon: Building2 },
  { href: "/blocks", label: "Blocos", icon: Building },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(item.href)}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
