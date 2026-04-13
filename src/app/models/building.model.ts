export interface Building {
  id: string;
  name: string;
  address: string;
  floors: number;
  yearBuilt: number;
  owner: string;
  description: string;
  geocode: { lat: number; lng: number };
}
