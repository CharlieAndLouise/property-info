import { TestBed } from '@angular/core/testing';
import { MapboxService } from './mapbox.service';

describe('MapboxService', () => {
  let service: MapboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapboxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose a createMap method', () => {
    expect(typeof service.createMap).toBe('function');
  });
});
