"use client";

import { Block, Sector, Room, Asset, Entity, EntityType } from './types';

const KEYS = {
  BLOCKS: 'inventory_blocks',
  SECTORS: 'inventory_sectors',
  ROOMS: 'inventory_rooms',
  ASSETS: 'inventory_assets',
};

// --- Generic Functions ---
const getFromStorage = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const data = window.localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(data));
};

const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// --- Seed Data ---
const seedData = () => {
  const blocks: Block[] = [
    { id: 'block-a', name: 'Bloco A - Administrativo' },
    { id: 'block-b', name: 'Bloco B - Acadêmico' },
    { id: 'block-c', name: 'Bloco C - Laboratórios' },
    { id: 'block-d', name: 'Bloco D - Acadêmico' },
  ];
  saveToStorage(KEYS.BLOCKS, blocks);

  const sectors: Sector[] = [
    // Bloco A - Administrativo
    { id: 'sector-ti', name: 'Tecnologia da Informação', abbreviation: 'TI', blockId: 'block-a' },
    { id: 'sector-rh', name: 'Recursos Humanos', abbreviation: 'RH', blockId: 'block-a' },
    { id: 'sector-fin', name: 'Financeiro', abbreviation: 'FIN', blockId: 'block-a' },
    { id: 'sector-mkt', name: 'Marketing', abbreviation: 'MKT', blockId: 'block-a' },

    // Bloco B - Acadêmico
    { id: 'sector-humanas', name: 'Ciências Humanas', abbreviation: 'HUM', blockId: 'block-b' },
    { id: 'sector-exatas', name: 'Ciências Exatas', abbreviation: 'EXA', blockId: 'block-b' },

    // Bloco C - Laboratórios
    { id: 'sector-labinfo', name: 'Laboratórios de Informática', abbreviation: 'LINFO', blockId: 'block-c' },
    { id: 'sector-labsaude', name: 'Laboratórios de Saúde', abbreviation: 'LSAU', blockId: 'block-c' },

    // Bloco D - Acadêmico
    { id: 'sector-saude', name: 'Ciências da Saúde', abbreviation: 'SAU', blockId: 'block-d' },
    { id: 'sector-sociais', name: 'Ciências Sociais', abbreviation: 'SOC', blockId: 'block-d' },
  ];
  saveToStorage(KEYS.SECTORS, sectors);

  const rooms: Room[] = [
    // Bloco A
    { id: 'room-a101', name: 'Sala 101', sectorId: 'sector-ti' },
    { id: 'room-a102', name: 'Sala 102', sectorId: 'sector-ti' },
    { id: 'room-a103', name: 'Sala 103', sectorId: 'sector-rh' },
    { id: 'room-a104', name: 'Sala 104', sectorId: 'sector-fin' },
    { id: 'room-a105', name: 'Sala 105', sectorId: 'sector-mkt' },

    // Bloco B
    { id: 'room-b101', name: 'Sala B101', sectorId: 'sector-humanas' },
    { id: 'room-b102', name: 'Sala B102', sectorId: 'sector-humanas' },
    { id: 'room-b201', name: 'Sala B201', sectorId: 'sector-exatas' },
    { id: 'room-b202', name: 'Sala B202', sectorId: 'sector-exatas' },
    
    // Bloco C
    { id: 'room-c101', name: 'Lab Infor 01', sectorId: 'sector-labinfo' },
    { id: 'room-c102', name: 'Lab Infor 02', sectorId: 'sector-labinfo' },
    { id: 'room-c201', name: 'Lab Anatomia', sectorId: 'sector-labsaude' },
    { id: 'room-c202', name: 'Lab Química', sectorId: 'sector-labsaude' },

    // Bloco D
    { id: 'room-d101', name: 'Sala D101', sectorId: 'sector-saude' },
    { id: 'room-d102', name: 'Sala D102', sectorId: 'sector-saude' },
    { id: 'room-d201', name: 'Sala D201', sectorId: 'sector-sociais' },
    { id: 'room-d202', name: 'Sala D202', sectorId: 'sector-sociais' },
  ];
  saveToStorage(KEYS.ROOMS, rooms);

  let assets: Asset[] = [];
  const addAsset = (name: string, roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const sector = sectors.find(s => s.id === room.sectorId);
    if (!sector) return;
    const assetsInRoom = assets.filter(a => a.roomId === roomId);
    const newAssetNumber = (assetsInRoom.length + 1).toString().padStart(3, '0');
    //PAT<SIGLA_SETOR><NUMERO_SALA><SEQUENCIAL>
    const newId = `PAT${sector.abbreviation}${room.name.replace(/\D/g, '')}${newAssetNumber}`;
    assets.push({ id: newId, name, roomId });
  }

  // Assets no Bloco A (Administrativo)
  addAsset('Cadeira de Escritório', 'room-a101');
  addAsset('Monitor Dell 24"', 'room-a101');
  addAsset('Servidor de Rede', 'room-a102');
  addAsset('Impressora Multifuncional', 'room-a103');
  
  // Assets no Bloco C (Laboratórios)
  addAsset('Computador i7 16GB RAM', 'room-c101');
  addAsset('Projetor Epson PowerLite', 'room-c101');
  addAsset('Esqueleto Humano', 'room-c201');
  addAsset('Microscópio Óptico', 'room-c202');

  saveToStorage(KEYS.ASSETS, assets);
};

export const inventoryService = {
  // --- Initialization ---
  initialize: () => {
    if (typeof window === 'undefined') return;
    if (!window.localStorage.getItem(KEYS.BLOCKS)) {
      seedData();
    }
  },

  // --- Generic Getters ---
  getAll: (entityType: EntityType) => getFromStorage<Entity>(KEYS[entityType.toUpperCase() as keyof typeof KEYS]),
  getById: (entityType: EntityType, id: string): Entity | undefined => {
    const items = getFromStorage<Entity>(KEYS[entityType.toUpperCase() as keyof typeof KEYS]);
    return items.find(item => item.id === id);
  },
  
  // --- Generic Mutators ---
  add: (entityType: EntityType, item: Omit<Entity, 'id'>): Entity => {
    const items = getFromStorage<Entity>(KEYS[entityType.toUpperCase() as keyof typeof KEYS]);
    let newItem: Entity;
    if (entityType === 'assets') {
      const assetData = item as Omit<Asset, 'id'>;
      const room = inventoryService.getById('rooms', assetData.roomId) as Room;
      const sector = inventoryService.getById('sectors', room.sectorId) as Sector;
      const assetsInRoom = inventoryService.getAssetsByRoomId(room.id);
      const newAssetNumber = (assetsInRoom.length + 1).toString().padStart(3, '0');
      const newId = `PAT${sector.abbreviation}${room.name.replace(/\D/g, '')}${newAssetNumber}`;
      newItem = { ...item, id: newId } as Asset;
    } else {
       newItem = { ...item, id: generateId(entityType.slice(0, -1)) } as Entity;
    }
    const newItems = [...items, newItem];
    saveToStorage(KEYS[entityType.toUpperCase() as keyof typeof KEYS], newItems);
    return newItem;
  },
  update: (entityType: EntityType, updatedItem: Entity): Entity => {
    const items = getFromStorage<Entity>(KEYS[entityType.toUpperCase() as keyof typeof KEYS]);
    const newItems = items.map(item => (item.id === updatedItem.id ? updatedItem : item));
    saveToStorage(KEYS[entityType.toUpperCase() as keyof typeof KEYS], newItems);
    return updatedItem;
  },
  delete: (entityType: EntityType, id: string): void => {
    const items = getFromStorage<Entity>(KEYS[entityType.toUpperCase() as keyof typeof KEYS]);
    const newItems = items.filter(item => item.id !== id);
    saveToStorage(KEYS[entityType.toUpperCase() as keyof typeof KEYS], newItems);

    // Hierarchical delete
    if (entityType === 'blocks') {
      const sectorsToDelete = inventoryService.getSectorsByBlockId(id);
      sectorsToDelete.forEach(sector => inventoryService.delete('sectors', sector.id));
    } else if (entityType === 'sectors') {
      const roomsToDelete = inventoryService.getRoomsBySectorId(id);
      roomsToDelete.forEach(room => inventoryService.delete('rooms', room.id));
    } else if (entityType === 'rooms') {
      const assetsToDelete = inventoryService.getAssetsByRoomId(id);
      assetsToDelete.forEach(asset => inventoryService.delete('assets', asset.id));
    }
  },

  // --- Specific Getters for relationships ---
  getSectorsByBlockId: (blockId: string): Sector[] => {
    const allSectors = getFromStorage<Sector>(KEYS.SECTORS);
    return allSectors.filter(sector => sector.blockId === blockId);
  },
  getRoomsBySectorId: (sectorId: string): Room[] => {
    const allRooms = getFromStorage<Room>(KEYS.ROOMS);
    return allRooms.filter(room => room.sectorId === sectorId);
  },
  getAssetsByRoomId: (roomId: string): Asset[] => {
    const allAssets = getFromStorage<Asset>(KEYS.ASSETS);
    return allAssets.filter(asset => asset.roomId === roomId);
  },

  // --- Statistics ---
  getStats: () => {
     if (typeof window === 'undefined') return { assetCount: 0, roomCount: 0, sectorCount: 0 };
     const assets = getFromStorage<Asset>(KEYS.ASSETS);
     const rooms = getFromStorage<Room>(KEYS.ROOMS);
     const sectors = getFromStorage<Sector>(KEYS.SECTORS);
     return {
        assetCount: assets.length,
        roomCount: rooms.length,
        sectorCount: sectors.length
     }
  }
};
