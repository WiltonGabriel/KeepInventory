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
    { id: 'block-a', name: 'Bloco A' },
    { id: 'block-b', name: 'Bloco B' },
    { id: 'block-c', name: 'Bloco C' },
  ];
  saveToStorage(KEYS.BLOCKS, blocks);

  const sectors: Sector[] = [
    { id: 'sector-ti', name: 'Tecnologia da Informação', abbreviation: 'TI', blockId: 'block-a' },
    { id: 'sector-rh', name: 'Recursos Humanos', abbreviation: 'RH', blockId: 'block-a' },
    { id: 'sector-acad', name: 'Acadêmico', abbreviation: 'ACAD', blockId: 'block-b' },
    { id: 'sector-fin', name: 'Financeiro', abbreviation: 'FIN', blockId: 'block-c' },
    { id: 'sector-mkt', name: 'Marketing', abbreviation: 'MKT', blockId: 'block-b' },
  ];
  saveToStorage(KEYS.SECTORS, sectors);

  const rooms: Room[] = [
    { id: 'room-101', name: 'Sala 101', sectorId: 'sector-ti' },
    { id: 'room-102', name: 'Sala 102', sectorId: 'sector-ti' },
    { id: 'room-103', name: 'Sala 103', sectorId: 'sector-rh' },
    { id: 'room-201', name: 'Sala 201', sectorId: 'sector-acad' },
    { id: 'room-202', name: 'Sala 202', sectorId: 'sector-mkt' },
    { id: 'room-301', name: 'Sala 301', sectorId: 'sector-fin' },
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
    const newId = `PAT${sector.abbreviation}${room.name.replace(/\D/g, '')}${newAssetNumber}`;
    assets.push({ id: newId, name, roomId });
  }

  addAsset('Cadeira Gamer', 'room-101');
  addAsset('Monitor Ultrawide', 'room-101');
  addAsset('Servidor Dell', 'room-102');
  addAsset('Impressora a Laser', 'room-103');
  addAsset('Projetor Epson', 'room-201');

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
      const room = inventoryService.getById('rooms', (item as Asset).roomId) as Room;
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
