
export interface Block {
  id: string;
  name: string;
}

export interface Sector {
  id: string;
  name: string;
  abbreviation: string;
  blockId: string;
}

export interface Room {
  id: string;
  name: string;
  sectorId: string;
}

export type AssetStatus = "Em Uso" | "Guardado" | "Desconhecido" | "Perdido";

export const assetStatusOptions: AssetStatus[] = ["Em Uso", "Guardado", "Desconhecido", "Perdido"];

export interface Asset {
  id: string;
  name: string;
  roomId: string;
  status: AssetStatus;
}

export interface UserProfile {
    name: string;
    email: string;
    role: string;
}

export type Entity = Block | Sector | Room | Asset;
export type EntityType = 'blocks' | 'sectors' | 'rooms' | 'assets';
