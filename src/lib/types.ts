

export interface Block {
  id: string;
  name: string;
}

export interface Sector {
  id: string;
  name: string;
  abbreviation: string; // Should be 3 letters
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

export interface Movement {
    id: string;
    assetId: string;
    assetName: string;
    timestamp: any; // Firestore Timestamp
    action: "Criado" | "Status Alterado" | "Movido" | "Nome Alterado";
    from: string;
    to: string;
}

export interface UserProfile {
    name: string;
    email: string;
    role: string;
}

export type Entity = Block | Sector | Room | Asset | Movement;
export type EntityType = 'blocos' | 'setores' | 'salas' | 'patrimonios' | 'movimentacoes';
