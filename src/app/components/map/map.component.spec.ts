import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { MapboxService } from '../../services/mapbox.service';
import { BuildingService } from '../../services/building.service';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Building } from '../../models/building.model';
import { importProvidersFrom } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { vi } from 'vitest';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let mockMapboxService: { createMap: ReturnType<typeof vi.fn> };
  let mockBuildingService: { getById: ReturnType<typeof vi.fn>; getAll: ReturnType<typeof vi.fn> };
  let mockOverlay: any;
  let mockOverlayRef: any;
  let mockMap: any;

  // Captures registered event handlers so tests can fire them
  const globalListeners: Record<string, Function[]> = {};
  const layerListeners: Record<string, Record<string, Function[]>> = {};

  function triggerGlobal(event: string, data: any = {}) {
    (globalListeners[event] || []).forEach(cb => cb(data));
  }

  function triggerLayer(layer: string, event: string, data: any = {}) {
    ((layerListeners[layer] || {})[event] || []).forEach(cb => cb(data));
  }

  beforeEach(async () => {
    // Reset listener stores between tests
    Object.keys(globalListeners).forEach(k => delete globalListeners[k]);
    Object.keys(layerListeners).forEach(k => delete layerListeners[k]);

    mockMap = {
      on: vi.fn().mockImplementation(
        (event: string, layerOrCb: string | Function, cb?: Function) => {
          if (typeof layerOrCb === 'function') {
            if (!globalListeners[event]) globalListeners[event] = [];
            globalListeners[event].push(layerOrCb);
          } else {
            if (!layerListeners[layerOrCb]) layerListeners[layerOrCb] = {};
            if (!layerListeners[layerOrCb][event]) layerListeners[layerOrCb][event] = [];
            layerListeners[layerOrCb][event].push(cb!);
          }
        }
      ),
      addLayer: vi.fn(),
      addSource: vi.fn(),
      remove: vi.fn(),
      getCanvas: vi.fn().mockReturnValue({ style: {} }),
    };

    mockMapboxService = { createMap: vi.fn().mockReturnValue(mockMap) };
    mockBuildingService = { getById: vi.fn(), getAll: vi.fn() };

    const mockComponentRef = {
      setInput: vi.fn(),
      instance: { closed: { subscribe: vi.fn() } }
    };

    mockOverlayRef = {
      attach: vi.fn().mockReturnValue(mockComponentRef),
      dispose: vi.fn(),
      backdropClick: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    };

    const mockPositionStrategy = {
      global: vi.fn().mockReturnValue({
        right: vi.fn().mockReturnValue({
          top: vi.fn().mockReturnValue({})
        })
      })
    };

    mockOverlay = {
      create: vi.fn().mockReturnValue(mockOverlayRef),
      position: vi.fn().mockReturnValue(mockPositionStrategy),
    };

    await TestBed.configureTestingModule({
      imports: [MapComponent, MatSnackBarModule],
      providers: [
        provideAnimations(),
        importProvidersFrom(OverlayModule),
        { provide: MapboxService, useValue: mockMapboxService },
        { provide: BuildingService, useValue: mockBuildingService },
        { provide: Overlay, useValue: mockOverlay },
      ]
    })
    .overrideProvider(Overlay, { useValue: mockOverlay })
    .compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngAfterViewInit → map registered

    // Simulate Mapbox firing the 'load' event
    triggerGlobal('load');
  });

  it('should create the Mapbox map via MapboxService', () => {
    expect(mockMapboxService.createMap).toHaveBeenCalled();
  });

  it('should add the city buildings layer on map load', () => {
    const layerIds = mockMap.addLayer.mock.calls.map((c: any[]) => c[0].id);
    expect(layerIds).toContain('city-buildings-3d');
  });

  it('should add the landmark GeoJSON source on map load', () => {
    expect(mockMap.addSource).toHaveBeenCalledWith('landmarks', expect.any(Object));
  });

  it('should add the landmark highlight layer on map load', () => {
    const layerIds = mockMap.addLayer.mock.calls.map((c: any[]) => c[0].id);
    expect(layerIds).toContain('landmark-buildings-3d');
  });

  it('should look up building and open overlay when a landmark is clicked', () => {
    const mockBuilding: Building = { id: 'empire-state-building', name: 'Empire State Building' } as any;
    mockBuildingService.getById.mockReturnValue(mockBuilding);

    triggerLayer('landmark-buildings-3d', 'click', {
      features: [{ properties: { buildingId: 'empire-state-building' } }]
    });

    expect(mockBuildingService.getById).toHaveBeenCalledWith('empire-state-building');
    expect(mockOverlay.create).toHaveBeenCalled();
    expect(mockOverlayRef.attach).toHaveBeenCalled();
  });

  it('should not open overlay when clicked feature has no matching building', () => {
    mockBuildingService.getById.mockReturnValue(undefined);

    triggerLayer('landmark-buildings-3d', 'click', {
      features: [{ properties: { buildingId: 'unknown-id' } }]
    });

    expect(mockOverlay.create).not.toHaveBeenCalled();
  });

  it('should dispose the existing overlay before opening a new one', () => {
    const mockBuilding: Building = { id: 'empire-state-building' } as any;
    mockBuildingService.getById.mockReturnValue(mockBuilding);

    triggerLayer('landmark-buildings-3d', 'click', {
      features: [{ properties: { buildingId: 'empire-state-building' } }]
    });
    triggerLayer('landmark-buildings-3d', 'click', {
      features: [{ properties: { buildingId: 'empire-state-building' } }]
    });

    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect(mockOverlay.create).toHaveBeenCalledTimes(2);
  });

  it('should remove the map on destroy', () => {
    component.ngOnDestroy();
    expect(mockMap.remove).toHaveBeenCalled();
  });
});
