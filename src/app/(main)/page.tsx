"use client";

import { useEffect, useState } from "react";
import { inventoryService } from "@/lib/data";
import { Block, Sector, Room, Asset } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Archive, Building, DoorOpen, Building2 } from "lucide-react";
import { redirect } from "next/navigation";

type Stats = {
  assetCount: number;
  roomCount: number;
  sectorCount: number;
};

export default function DashboardRedirectPage() {
    redirect('/dashboard');
    return null;
}
