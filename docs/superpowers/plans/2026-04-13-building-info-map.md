# Building Info Map — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Angular app showing a 3D Mapbox map of NYC where clicking a highlighted landmark building opens a CDK Overlay side panel with hard-coded building info.

**Architecture:** Bare Mapbox GL JS (no wrapper) initialised inside `MapComponent`. A custom GeoJSON source drives the amber-highlighted landmark extrusion layer; the city-wide grey extrusion layer uses the Mapbox composite source. Clicking a landmark calls `BuildingService.getById`, then opens `BuildingPanelComponent` via Angular CDK `Overlay` with a `GlobalPositionStrategy` right-side panel.

**Tech Stack:** Angular 17+ (standalone), Angular Material 17, Angular CDK Overlay, Mapbox GL JS v3, TypeScript, Jasmine/Karma

---

## File Structure

```
c:/work/building-info/
├── angular.json                                  (generated + patched for mapbox CSS)
├── package.json
├── tsconfig.json
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss                               (Material theme + global reset)
│   ├── environments/
│   │   ├── environment.ts                        (mapboxToken placeholder)
│   │   └── environment.development.ts
│   └── app/
│       ├── app.component.ts                      (root shell, full-screen MapComponent)
│       ├── app.component.html
│       ├── app.component.scss
│       ├── app.config.ts                         (provideAnimationsAsync, OverlayModule)
│       ├── models/
│       │   └── building.model.ts                 (Building interface)
│       ├── data/
│       │   └── landmark-footprints.ts            (GeoJSON FeatureCollection constant)
│       ├── services/
│       │   ├── building.service.ts               (hard-coded data, getById, getAll)
│       │   ├── building.service.spec.ts
│       │   ├── mapbox.service.ts                 (createMap wrapper for testability)
│       │   └── mapbox.service.spec.ts
│       └── components/
│           ├── map/
│           │   ├── map.component.ts              (map lifecycle, layers, click, overlay)
│           │   ├── map.component.html
│           │   ├── map.component.scss
│           │   └── map.component.spec.ts
│           └── building-panel/
│               ├── building-panel.component.ts   (slide-in panel, Material UI)
│               ├── building-panel.component.html
│               ├── building-panel.component.scss
│               └── building-panel.component.spec.ts
```

---

## Task 1: Scaffold Angular Project & Install Dependencies

**Files:**
- Create: entire project root (via CLI)
- Modify: `angular.json` — add mapbox CSS to styles array
- Modify: `src/environments/environment.ts` — add mapboxToken
- Modify: `src/app/app.config.ts` — add OverlayModule, animations

- [ ] **Step 1: Create the Angular project**

Run in `c:/work/building-info` (the directory must already exist and be empty):
```bash
cd c:/work/building-info
npx @angular/cli@latest new building-info --standalone --routing=false --style=scss --directory=.
```
Expected: Angular project scaffolded in current directory, `package.json` created.

- [ ] **Step 2: Add Angular Material (sets up theme, animations, hammer)**

```bash
ng add @angular/material --theme=indigo-pink --typography=true --animations=enabled
```
Expected: `styles.scss` updated with Material imports, `app.config.ts` updated with `provideAnimationsAsync`.

- [ ] **Step 3: Install Mapbox GL JS**

```bash
npm install mapbox-gl
npm install --save-dev @types/mapbox-gl
```
Expected: `node_modules/mapbox-gl` exists.

- [ ] **Step 4: Add Mapbox CSS to angular.json styles array**

In `angular.json`, find the `"styles"` array under `projects > building-info > architect > build > options` and add the Mapbox stylesheet before `src/styles.scss`:

```json
"styles": [
  "node_modules/mapbox-gl/dist/mapbox-gl.css",
  "src/styles.scss"
]
```

Do the same in the `test` target's `"styles"` array.

- [ ] **Step 5: Set Mapbox token in environment files**

Replace the contents of `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  mapboxToken: 'YOUR_MAPBOX_TOKEN_HERE'
};
```

Create `src/environments/environment.development.ts`:
```typescript
export const environment = {
  production: false,
  mapboxToken: 'YOUR_MAPBOX_TOKEN_HERE'
};
```

> To get a free Mapbox token: sign up at mapbox.com → Account → Access Tokens.

- [ ] **Step 6: Update app.config.ts to provide CDK Overlay**

Replace `src/app/app.config.ts`:
```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { OverlayModule } from '@angular/cdk/overlay';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    importProvidersFrom(OverlayModule),
  ]
};
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: scaffold Angular project with Material, CDK Overlay, and Mapbox GL JS"
```

---

## Task 2: Building Model & BuildingService

**Files:**
- Create: `src/app/models/building.model.ts`
- Create: `src/app/services/building.service.ts`
- Create: `src/app/services/building.service.spec.ts`

- [ ] **Step 1: Create the Building interface**

Create `src/app/models/building.model.ts`:
```typescript
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
```

- [ ] **Step 2: Write failing tests for BuildingService**

Create `src/app/services/building.service.spec.ts`:
```typescript
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
        expect(b.id).toBeTruthy(`id missing on ${b.name}`);
        expect(b.name).toBeTruthy(`name missing on ${b.id}`);
        expect(b.address).toBeTruthy(`address missing on ${b.id}`);
        expect(b.floors).toBeGreaterThan(0, `floors missing on ${b.id}`);
        expect(b.yearBuilt).toBeGreaterThan(0, `yearBuilt missing on ${b.id}`);
        expect(b.owner).toBeTruthy(`owner missing on ${b.id}`);
        expect(b.description).toBeTruthy(`description missing on ${b.id}`);
        expect(typeof b.geocode.lat).toBe('number', `geocode.lat missing on ${b.id}`);
        expect(typeof b.geocode.lng).toBe('number', `geocode.lng missing on ${b.id}`);
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
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
ng test --watch=false --browsers=ChromeHeadless
```
Expected: FAILED — `BuildingService` and `LANDMARK_BUILDINGS` not found.

- [ ] **Step 4: Implement BuildingService**

Create `src/app/services/building.service.ts`:
```typescript
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
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
ng test --watch=false --browsers=ChromeHeadless
```
Expected: All BuildingService tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/models/building.model.ts src/app/services/building.service.ts src/app/services/building.service.spec.ts
git commit -m "feat: add Building model and BuildingService with hard-coded NYC landmarks"
```

---

## Task 3: BuildingPanelComponent

**Files:**
- Create: `src/app/components/building-panel/building-panel.component.ts`
- Create: `src/app/components/building-panel/building-panel.component.html`
- Create: `src/app/components/building-panel/building-panel.component.scss`
- Create: `src/app/components/building-panel/building-panel.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/components/building-panel/building-panel.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuildingPanelComponent } from './building-panel.component';
import { Building } from '../../models/building.model';
import { provideAnimations } from '@angular/platform-browser/animations';

const MOCK_BUILDING: Building = {
  id: 'test-tower',
  name: 'Test Tower',
  address: '123 Test St, New York, NY 10001',
  floors: 50,
  yearBuilt: 2000,
  owner: 'Test Corp',
  description: 'A test building used for unit testing.',
  geocode: { lat: 40.7128, lng: -74.006 }
};

describe('BuildingPanelComponent', () => {
  let component: BuildingPanelComponent;
  let fixture: ComponentFixture<BuildingPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildingPanelComponent],
      providers: [provideAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(BuildingPanelComponent);
    component = fixture.componentInstance;
    component.building = MOCK_BUILDING;
    fixture.detectChanges();
  });

  it('should display the building name in the toolbar', () => {
    const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
    expect(toolbar.textContent).toContain('Test Tower');
  });

  it('should display the address', () => {
    expect(fixture.nativeElement.textContent).toContain('123 Test St, New York, NY 10001');
  });

  it('should display the floor count', () => {
    expect(fixture.nativeElement.textContent).toContain('50');
  });

  it('should display the year built', () => {
    expect(fixture.nativeElement.textContent).toContain('2000');
  });

  it('should display the owner', () => {
    expect(fixture.nativeElement.textContent).toContain('Test Corp');
  });

  it('should display the geocode latitude and longitude', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('40.7128');
    expect(text).toContain('-74.006');
  });

  it('should display the description', () => {
    expect(fixture.nativeElement.textContent).toContain('A test building used for unit testing.');
  });

  it('should emit closed when the close button is clicked', () => {
    spyOn(component.closed, 'emit');
    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Close panel"]');
    closeBtn.click();
    expect(component.closed.emit).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
ng test --watch=false --browsers=ChromeHeadless
```
Expected: FAILED — `BuildingPanelComponent` not found.

- [ ] **Step 3: Create the component TypeScript file**

Create `src/app/components/building-panel/building-panel.component.ts`:
```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, transition, style, animate } from '@angular/animations';
import { Building } from '../../models/building.model';

@Component({
  selector: 'app-building-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './building-panel.component.html',
  styleUrl: './building-panel.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('250ms ease-out', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class BuildingPanelComponent {
  @Input() building!: Building;
  @Output() closed = new EventEmitter<void>();
}
```

- [ ] **Step 4: Create the template**

Create `src/app/components/building-panel/building-panel.component.html`:
```html
<div class="panel-wrapper" [@slideIn]>
  <mat-toolbar color="primary">
    <span class="panel-title">{{ building.name }}</span>
    <span class="toolbar-spacer"></span>
    <button mat-icon-button (click)="closed.emit()" aria-label="Close panel">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-list>
    <mat-list-item>
      <mat-icon matListItemIcon>location_on</mat-icon>
      <span matListItemTitle>Address</span>
      <span matListItemLine>{{ building.address }}</span>
    </mat-list-item>

    <mat-list-item>
      <mat-icon matListItemIcon>domain</mat-icon>
      <span matListItemTitle>Floors</span>
      <span matListItemLine>{{ building.floors }}</span>
    </mat-list-item>

    <mat-list-item>
      <mat-icon matListItemIcon>calendar_today</mat-icon>
      <span matListItemTitle>Year Built</span>
      <span matListItemLine>{{ building.yearBuilt }}</span>
    </mat-list-item>

    <mat-list-item>
      <mat-icon matListItemIcon>person</mat-icon>
      <span matListItemTitle>Owner</span>
      <span matListItemLine>{{ building.owner }}</span>
    </mat-list-item>

    <mat-list-item>
      <mat-icon matListItemIcon>pin_drop</mat-icon>
      <span matListItemTitle>Geocode</span>
      <span matListItemLine>{{ building.geocode.lat }}, {{ building.geocode.lng }}</span>
    </mat-list-item>
  </mat-list>

  <mat-card class="description-card">
    <mat-card-content>
      <p>{{ building.description }}</p>
    </mat-card-content>
  </mat-card>
</div>
```

- [ ] **Step 5: Create the styles**

Create `src/app/components/building-panel/building-panel.component.scss`:
```scss
.panel-wrapper {
  width: 400px;
  height: 100vh;
  background: white;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.25);

  @media (max-width: 600px) {
    width: 100vw;
  }
}

.panel-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-spacer {
  flex: 1;
}

.description-card {
  margin: 16px;
  flex-shrink: 0;
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
ng test --watch=false --browsers=ChromeHeadless
```
Expected: All BuildingPanelComponent tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/components/building-panel/
git commit -m "feat: add BuildingPanelComponent with Material UI and slide-in animation"
```

---

## Task 4: Landmark GeoJSON Footprints Data

**Files:**
- Create: `src/app/data/landmark-footprints.ts`

These are simplified rectangular polygon approximations of each building's footprint. Heights are in metres and drive the 3D extrusion.

- [ ] **Step 1: Create the data file**

Create `src/app/data/landmark-footprints.ts`:
```typescript
import type { FeatureCollection, Feature, Polygon } from 'geojson';

export interface LandmarkProperties {
  buildingId: string;
  height: number;
  base: number;
}

export const LANDMARK_FOOTPRINTS: FeatureCollection<Polygon, LandmarkProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'empire-state-building',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-73.9863, 40.7481], [-73.9851, 40.7481],
          [-73.9851, 40.7488], [-73.9863, 40.7488],
          [-73.9863, 40.7481]
        ]]
      },
      properties: { buildingId: 'empire-state-building', height: 443, base: 0 }
    },
    {
      type: 'Feature',
      id: 'one-world-trade-center',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-74.0138, 40.7124], [-74.0130, 40.7124],
          [-74.0130, 40.7131], [-74.0138, 40.7131],
          [-74.0138, 40.7124]
        ]]
      },
      properties: { buildingId: 'one-world-trade-center', height: 417, base: 0 }
    },
    {
      type: 'Feature',
      id: 'chrysler-building',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-73.9758, 40.7513], [-73.9750, 40.7513],
          [-73.9750, 40.7519], [-73.9758, 40.7519],
          [-73.9758, 40.7513]
        ]]
      },
      properties: { buildingId: 'chrysler-building', height: 282, base: 0 }
    },
    {
      type: 'Feature',
      id: 'flatiron-building',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-73.9903, 40.7408], [-73.9894, 40.7408],
          [-73.9894, 40.7415], [-73.9903, 40.7415],
          [-73.9903, 40.7408]
        ]]
      },
      properties: { buildingId: 'flatiron-building', height: 87, base: 0 }
    },
    {
      type: 'Feature',
      id: 'rockefeller-center',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-73.9791, 40.7584], [-73.9783, 40.7584],
          [-73.9783, 40.7590], [-73.9791, 40.7590],
          [-73.9791, 40.7584]
        ]]
      },
      properties: { buildingId: 'rockefeller-center', height: 260, base: 0 }
    }
  ]
};
```

- [ ] **Step 2: Commit**

```bash
git add src/app/data/landmark-footprints.ts
git commit -m "feat: add hard-coded GeoJSON footprint data for 5 NYC landmark buildings"
```

---

## Task 5: MapboxService

**Files:**
- Create: `src/app/services/mapbox.service.ts`
- Create: `src/app/services/mapbox.service.spec.ts`

This thin wrapper exists purely so `MapComponent` tests can mock map creation without instantiating a real WebGL context.

- [ ] **Step 1: Write failing test**

Create `src/app/services/mapbox.service.spec.ts`:
```typescript
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
```

- [ ] **Step 2: Run test — verify it fails**

```bash
ng test --watch=false --browsers=ChromeHeadless
```
Expected: FAILED — `MapboxService` not found.

- [ ] **Step 3: Implement MapboxService**

Create `src/app/services/mapbox.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import mapboxgl from 'mapbox-gl';

@Injectable({ providedIn: 'root' })
export class MapboxService {
  createMap(
    container: HTMLElement,
    options: Omit<mapboxgl.MapboxOptions, 'container'>
  ): mapboxgl.Map {
    return new mapboxgl.Map({ container, ...options });
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
ng test --watch=false --browsers=ChromeHeadless
```
Expected: MapboxService tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/services/mapbox.service.ts src/app/services/mapbox.service.spec.ts
git commit -m "feat: add MapboxService wrapper for testable map instantiation"
```

---

## Task 6: MapComponent

**Files:**
- Create: `src/app/components/map/map.component.ts`
- Create: `src/app/components/map/map.component.html`
- Create: `src/app/components/map/map.component.scss`
- Create: `src/app/components/map/map.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/components/map/map.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { MapboxService } from '../../services/mapbox.service';
import { BuildingService } from '../../services/building.service';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Building } from '../../models/building.model';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let mockMapboxService: jasmine.SpyObj<MapboxService>;
  let mockBuildingService: jasmine.SpyObj<BuildingService>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let mockMap: any;

  // Captures registered event handlers so tests can fire them
  const globalListeners: { [event: string]: Function[] } = {};
  const layerListeners: { [layer: string]: { [event: string]: Function[] } } = {};

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
      on: jasmine.createSpy('on').and.callFake(
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
      addLayer: jasmine.createSpy('addLayer'),
      addSource: jasmine.createSpy('addSource'),
      remove: jasmine.createSpy('remove'),
      getCanvas: jasmine.createSpy('getCanvas').and.returnValue({ style: {} }),
    };

    mockMapboxService = jasmine.createSpyObj('MapboxService', ['createMap']);
    mockMapboxService.createMap.and.returnValue(mockMap);

    mockBuildingService = jasmine.createSpyObj('BuildingService', ['getById', 'getAll']);

    const mockComponentRef = {
      setInput: jasmine.createSpy('setInput'),
      instance: { closed: { subscribe: jasmine.createSpy('subscribe') } }
    };

    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.attach.and.returnValue(mockComponentRef);
    mockOverlayRef.backdropClick.and.returnValue({ subscribe: jasmine.createSpy('subscribe') });

    const mockPositionStrategy = {
      global: jasmine.createSpy('global').and.returnValue({
        right: jasmine.createSpy('right').and.returnValue({
          top: jasmine.createSpy('top').and.returnValue({})
        })
      })
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position']);
    mockOverlay.position.and.returnValue(mockPositionStrategy as any);
    mockOverlay.create.and.returnValue(mockOverlayRef);

    await TestBed.configureTestingModule({
      imports: [MapComponent, MatSnackBarModule],
      providers: [
        provideAnimations(),
        { provide: MapboxService, useValue: mockMapboxService },
        { provide: BuildingService, useValue: mockBuildingService },
        { provide: Overlay, useValue: mockOverlay },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngAfterViewInit → map registered

    // Simulate Mapbox firing its 'load' event
    triggerGlobal('load');
  });

  it('should create the Mapbox map via MapboxService', () => {
    expect(mockMapboxService.createMap).toHaveBeenCalled();
  });

  it('should add the city buildings layer on map load', () => {
    const calls = mockMap.addLayer.calls.all().map((c: any) => c.args[0].id);
    expect(calls).toContain('city-buildings-3d');
  });

  it('should add the landmark source on map load', () => {
    expect(mockMap.addSource).toHaveBeenCalledWith('landmarks', jasmine.any(Object));
  });

  it('should add the landmark highlight layer on map load', () => {
    const calls = mockMap.addLayer.calls.all().map((c: any) => c.args[0].id);
    expect(calls).toContain('landmark-buildings-3d');
  });

  it('should look up building and open overlay when a landmark is clicked', () => {
    const mockBuilding: Building = { id: 'empire-state-building', name: 'Empire State Building' } as any;
    mockBuildingService.getById.and.returnValue(mockBuilding);

    triggerLayer('landmark-buildings-3d', 'click', {
      features: [{ properties: { buildingId: 'empire-state-building' } }]
    });

    expect(mockBuildingService.getById).toHaveBeenCalledWith('empire-state-building');
    expect(mockOverlay.create).toHaveBeenCalled();
    expect(mockOverlayRef.attach).toHaveBeenCalled();
  });

  it('should not open overlay when clicked feature has no matching building', () => {
    mockBuildingService.getById.and.returnValue(undefined);

    triggerLayer('landmark-buildings-3d', 'click', {
      features: [{ properties: { buildingId: 'unknown-id' } }]
    });

    expect(mockOverlay.create).not.toHaveBeenCalled();
  });

  it('should dispose the existing overlay before opening a new one', () => {
    const mockBuilding: Building = { id: 'empire-state-building' } as any;
    mockBuildingService.getById.and.returnValue(mockBuilding);

    // Click twice
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
ng test --watch=false --browsers=ChromeHeadless
```
Expected: FAILED — `MapComponent` not found.

- [ ] **Step 3: Create the component TypeScript file**

Create `src/app/components/map/map.component.ts`:
```typescript
import {
  Component, AfterViewInit, OnDestroy,
  ElementRef, ViewChild, inject, NgZone
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { BuildingService } from '../../services/building.service';
import { MapboxService } from '../../services/mapbox.service';
import { BuildingPanelComponent } from '../building-panel/building-panel.component';
import { LANDMARK_FOOTPRINTS } from '../../data/landmark-footprints';
import { Building } from '../../models/building.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [MatSnackBarModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map!: mapboxgl.Map;
  private overlayRef: OverlayRef | null = null;

  private readonly buildingService = inject(BuildingService);
  private readonly mapboxService = inject(MapboxService);
  private readonly overlay = inject(Overlay);
  private readonly snackBar = inject(MatSnackBar);
  private readonly ngZone = inject(NgZone);

  ngAfterViewInit(): void {
    mapboxgl.accessToken = environment.mapboxToken;

    this.ngZone.runOutsideAngular(() => {
      this.map = this.mapboxService.createMap(this.mapContainer.nativeElement, {
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-73.9857, 40.7484],
        zoom: 15.5,
        pitch: 45,
        bearing: -17.6,
      });

      this.map.on('error', () => {
        this.ngZone.run(() => {
          this.snackBar.open(
            'Map failed to load. Please check configuration.',
            'Dismiss',
            { duration: 5000 }
          );
        });
      });

      this.map.on('load', () => {
        this.ngZone.run(() => this.onMapLoad());
      });
    });
  }

  private onMapLoad(): void {
    this.addCityBuildingsLayer();
    this.addLandmarkLayer();
    this.registerLandmarkClickHandler();
  }

  private addCityBuildingsLayer(): void {
    this.map.addLayer({
      id: 'city-buildings-3d',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#aaaaaa',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.8,
      },
    });
  }

  private addLandmarkLayer(): void {
    this.map.addSource('landmarks', {
      type: 'geojson',
      data: LANDMARK_FOOTPRINTS as GeoJSON.FeatureCollection,
    });

    this.map.addLayer({
      id: 'landmark-buildings-3d',
      source: 'landmarks',
      type: 'fill-extrusion',
      paint: {
        'fill-extrusion-color': '#f5a623',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'base'],
        'fill-extrusion-opacity': 0.95,
      },
    });
  }

  private registerLandmarkClickHandler(): void {
    this.map.on('click', 'landmark-buildings-3d', (e) => {
      if (!e.features || e.features.length === 0) return;
      const buildingId = e.features[0].properties?.['buildingId'] as string;
      const building = this.buildingService.getById(buildingId);
      if (!building) return;
      this.openPanel(building);
    });

    this.map.on('mouseenter', 'landmark-buildings-3d', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'landmark-buildings-3d', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  private openPanel(building: Building): void {
    this.closePanel();

    const positionStrategy = this.overlay
      .position()
      .global()
      .right('0')
      .top('0');

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      height: '100vh',
      width: '400px',
    });

    const portal = new ComponentPortal(BuildingPanelComponent);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.setInput('building', building);
    componentRef.instance.closed.subscribe(() => this.closePanel());
    this.overlayRef.backdropClick().subscribe(() => this.closePanel());
  }

  private closePanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  ngOnDestroy(): void {
    this.closePanel();
    this.map?.remove();
  }
}
```

- [ ] **Step 4: Create the template**

Create `src/app/components/map/map.component.html`:
```html
<div #mapContainer class="map-container"></div>
```

- [ ] **Step 5: Create the styles**

Create `src/app/components/map/map.component.scss`:
```scss
:host {
  display: block;
  width: 100%;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
ng test --watch=false --browsers=ChromeHeadless
```
Expected: All MapComponent tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/components/map/
git commit -m "feat: add MapComponent with city 3D layer, landmark highlight layer, and CDK overlay click handler"
```

---

## Task 7: AppComponent Integration & Full-Screen Layout

**Files:**
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.html`
- Modify: `src/app/app.component.scss`
- Modify: `src/styles.scss`

- [ ] **Step 1: Update AppComponent to render the map full-screen**

Replace `src/app/app.component.ts`:
```typescript
import { Component } from '@angular/core';
import { MapComponent } from './components/map/map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {}
```

Replace `src/app/app.component.html`:
```html
<app-map></app-map>
```

Replace `src/app/app.component.scss`:
```scss
:host {
  display: block;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
```

- [ ] **Step 2: Update global styles**

In `src/styles.scss`, add after the existing Material theme import:
```scss
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
```

- [ ] **Step 3: Replace Mapbox token and verify the app runs**

In `src/environments/environment.ts`, replace `'YOUR_MAPBOX_TOKEN_HERE'` with your real Mapbox public token.

```bash
ng serve
```

Open `http://localhost:4200`. Expected:
- Full-screen dark Mapbox map of NYC centred on the Empire State Building area.
- 3D grey buildings visible at zoom 15+.
- 5 amber/gold landmarks visible.
- Clicking an amber building opens a right-side panel with the building's details.
- Panel closes on the X button or backdrop click.

- [ ] **Step 4: Commit**

```bash
git add src/app/app.component.ts src/app/app.component.html src/app/app.component.scss src/styles.scss
git commit -m "feat: wire AppComponent full-screen layout and integrate MapComponent"
```

---

## Task 8: Final Polish — Overlay Width on Mobile

**Files:**
- Modify: `src/app/components/map/map.component.ts` — responsive overlay width

The CDK overlay width is set to `400px` at creation time. On mobile (≤ 600px) the panel SCSS already sets `width: 100vw`, but the overlay container itself needs to match. This task makes the overlay width responsive.

- [ ] **Step 1: Inject Platform and compute width at runtime**

In `src/app/components/map/map.component.ts`, update the `openPanel` method to compute the overlay width based on viewport:

```typescript
// Replace the openPanel method with this version:
private openPanel(building: Building): void {
  this.closePanel();

  const isMobile = window.innerWidth <= 600;
  const panelWidth = isMobile ? '100vw' : '400px';

  const positionStrategy = this.overlay
    .position()
    .global()
    .right('0')
    .top('0');

  this.overlayRef = this.overlay.create({
    positionStrategy,
    hasBackdrop: true,
    backdropClass: 'cdk-overlay-transparent-backdrop',
    height: '100vh',
    width: panelWidth,
  });

  const portal = new ComponentPortal(BuildingPanelComponent);
  const componentRef = this.overlayRef.attach(portal);
  componentRef.setInput('building', building);
  componentRef.instance.closed.subscribe(() => this.closePanel());
  this.overlayRef.backdropClick().subscribe(() => this.closePanel());
}
```

- [ ] **Step 2: Run all tests to confirm nothing regressed**

```bash
ng test --watch=false --browsers=ChromeHeadless
```
Expected: All tests PASS.

- [ ] **Step 3: Build for production to verify no compilation errors**

```bash
ng build
```
Expected: Build completes with no errors. Output in `dist/building-info/`.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/map/map.component.ts
git commit -m "feat: make CDK overlay panel width responsive for mobile viewports"
```

---

## Spec Coverage Checklist

| Spec requirement | Covered by |
|---|---|
| Angular + Angular Material + Mapbox GL JS | Task 1 |
| City-wide 3D grey building extrusion layer | Task 6 — `addCityBuildingsLayer` |
| 5 famous NYC landmark buildings | Task 2 — `BuildingService`, Task 4 — `LANDMARK_FOOTPRINTS` |
| Amber/gold highlight color for landmarks | Task 6 — `landmark-buildings-3d` layer paint |
| CDK Overlay side panel (right, full height) | Task 6 — `openPanel` |
| Slide-in animation | Task 3 — `@slideIn` trigger |
| Building name, address, floors, year, owner, geocode, description | Task 3 — `BuildingPanelComponent` template |
| Close on X button | Task 3 — `closed.emit()` |
| Close on backdrop click | Task 6 — `backdropClick().subscribe` |
| One panel at a time | Task 6 — `closePanel()` before `create()` |
| Snackbar on map error | Task 6 — `map.on('error', ...)` |
| Pointer cursor on hover | Task 6 — `mouseenter/mouseleave` handlers |
| Mobile responsive panel width | Task 8 |
| Unit tests for BuildingService | Task 2 |
| Unit tests for BuildingPanelComponent | Task 3 |
| Unit tests for MapComponent | Task 6 |
