import { Injectable } from '@angular/core';
import { Building } from '../models/building.model';

export const LANDMARK_BUILDINGS: Building[] = [
  {
    id: 'empire-state-building',
    name: 'Empire State Building',
    address: '350 5th Ave, New York, NY 10118',
    floors: 102,
    yearBuilt: 1931,
    owner: 'Empire State Realty Trust',
    description: 'A 102-story Art Deco skyscraper in Midtown Manhattan. It stood as the world\'s tallest building for nearly 40 years after its 1931 completion.',
    geocode: { lat: 40.7484, lng: -73.9857 }
  },
  {
    id: 'one-world-trade-center',
    name: 'One World Trade Center',
    address: '285 Fulton St, New York, NY 10007',
    floors: 104,
    yearBuilt: 2014,
    owner: 'Port Authority of New York and New Jersey',
    description: 'The tallest building in the Western Hemisphere at 541 metres. Built on the site of the Twin Towers destroyed on September 11, 2001.',
    geocode: { lat: 40.7127, lng: -74.0134 }
  },
  {
    id: 'chrysler-building',
    name: 'Chrysler Building',
    address: '405 Lexington Ave, New York, NY 10174',
    floors: 77,
    yearBuilt: 1930,
    owner: 'SIGNA Holding / RFR Holding',
    description: 'An Art Deco masterpiece and briefly the world\'s tallest building. Famous for its stainless steel eagle gargoyles and sunburst crown.',
    geocode: { lat: 40.7516, lng: -73.9754 }
  },
  {
    id: 'flatiron-building',
    name: 'Flatiron Building',
    address: '175 5th Ave, New York, NY 10010',
    floors: 22,
    yearBuilt: 1902,
    owner: 'GFP Real Estate / AXA Financial',
    description: 'One of New York\'s most iconic early skyscrapers, celebrated for its distinctive triangular shape at the intersection of Broadway and Fifth Avenue.',
    geocode: { lat: 40.7411, lng: -73.9898 }
  },
  {
    id: 'rockefeller-center',
    name: '30 Rockefeller Plaza',
    address: '30 Rockefeller Plaza, New York, NY 10112',
    floors: 70,
    yearBuilt: 1933,
    owner: 'Tishman Speyer',
    description: 'Centerpiece of Rockefeller Center. Home to NBC Studios and the Top of the Rock observation deck. A defining example of Art Deco urban planning.',
    geocode: { lat: 40.7587, lng: -73.9787 }
  }
];

@Injectable({ providedIn: 'root' })
export class BuildingService {
  private readonly buildings: Building[] = LANDMARK_BUILDINGS;

  getAll(): Building[] {
    return this.buildings;
  }

  getById(id: string): Building | undefined {
    return this.buildings.find(b => b.id === id);
  }
}
