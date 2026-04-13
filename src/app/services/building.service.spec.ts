import { TestBed } from '@angular/core/testing';
import { BuildingService, LANDMARK_BUILDINGS } from './building.service';

describe('BuildingService', () => {
  let service: BuildingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BuildingService);
  });

  describe('LANDMARK_BUILDINGS constant', () => {
    it('should contain exactly 5 buildings', () => {
      expect(LANDMARK_BUILDINGS.length).toBe(5);
    });

    it('should have all required fields populated for every building', () => {
      LANDMARK_BUILDINGS.forEach(b => {
        expect(b.id).toBeTruthy();
        expect(b.name).toBeTruthy();
        expect(b.address).toBeTruthy();
        expect(b.floors).toBeGreaterThan(0);
        expect(b.yearBuilt).toBeGreaterThan(0);
        expect(b.owner).toBeTruthy();
        expect(b.description).toBeTruthy();
        expect(typeof b.geocode.lat).toBe('number');
        expect(typeof b.geocode.lng).toBe('number');
      });
    });
  });

  describe('getById', () => {
    it('should return the correct building for a known id', () => {
      const result = service.getById('empire-state-building');
      expect(result).toBeDefined();
      expect(result!.name).toBe('Empire State Building');
    });

    it('should return undefined for an unknown id', () => {
      expect(service.getById('not-a-real-building')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all 5 buildings', () => {
      expect(service.getAll().length).toBe(5);
    });
  });
});
