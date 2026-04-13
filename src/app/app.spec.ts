import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { MapboxService } from './services/mapbox.service';
import { BuildingService } from './services/building.service';
import { Overlay } from '@angular/cdk/overlay';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { vi } from 'vitest';

describe('App', () => {
  beforeEach(async () => {
    const mockMap = {
      on: vi.fn(),
      addLayer: vi.fn(),
      addSource: vi.fn(),
      remove: vi.fn(),
      getCanvas: vi.fn().mockReturnValue({ style: {} }),
    };

    const mockMapboxService = { createMap: vi.fn().mockReturnValue(mockMap) };
    const mockBuildingService = { getById: vi.fn(), getAll: vi.fn() };

    const mockOverlayRef = {
      attach: vi.fn().mockReturnValue({
        setInput: vi.fn(),
        instance: { closed: { subscribe: vi.fn() } },
      }),
      dispose: vi.fn(),
      backdropClick: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    };

    const mockOverlay = {
      create: vi.fn().mockReturnValue(mockOverlayRef),
      position: vi.fn().mockReturnValue({
        global: vi.fn().mockReturnValue({
          right: vi.fn().mockReturnValue({
            top: vi.fn().mockReturnValue({}),
          }),
        }),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [App, MatSnackBarModule],
      providers: [
        provideAnimations(),
        importProvidersFrom(OverlayModule),
        { provide: MapboxService, useValue: mockMapboxService },
        { provide: BuildingService, useValue: mockBuildingService },
        { provide: Overlay, useValue: mockOverlay },
      ],
    })
      .overrideProvider(Overlay, { useValue: mockOverlay })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render app-map', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-map')).not.toBeNull();
  });
});
