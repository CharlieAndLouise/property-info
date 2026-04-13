# Building Info Map — Design Spec

**Date:** 2026-04-13
**Status:** Approved

---

## Overview

A single-page Angular application that displays an interactive 3D map of New York City. The city's buildings are rendered as 3D extrusions using Mapbox GL JS. A curated set of famous NYC landmark buildings are highlighted in a distinct color. Clicking a landmark opens a slide-in side panel showing rich building information.

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Angular (standalone components) |
| UI components | Angular Material |
| Map | Mapbox GL JS (native, no wrapper library) |
| Side panel | Angular CDK Overlay (`GlobalPositionStrategy`) |
| Styling | Angular Material theming + component CSS |
| Config | `environment.ts` for Mapbox token |

---

## Data Model

```typescript
interface Building {
  id: string;
  name: string;
  address: string;
  floors: number;
  yearBuilt: number;
  owner: string;
  description: string;
  geocode: { lat: number; lng: number };
  mapboxBuildingId?: string; // Mapbox OSM feature ID for highlight layer filter
}
```

### Hard-Coded Landmark Buildings (BuildingService)

| Building | Address | Floors | Year Built |
|---|---|---|---|
| Empire State Building | 350 5th Ave, New York, NY 10118 | 102 | 1931 |
| One World Trade Center | 285 Fulton St, New York, NY 10007 | 104 | 2014 |
| Chrysler Building | 405 Lexington Ave, New York, NY 10174 | 77 | 1930 |
| Flatiron Building | 175 5th Ave, New York, NY 10010 | 22 | 1902 |
| Rockefeller Center (30 Rock) | 30 Rockefeller Plaza, New York, NY 10112 | 70 | 1933 |

---

## Architecture

```
AppComponent
  └── MapComponent
        ├── Mapbox GL JS instance (native API)
        ├── BuildingService (injected — provides hard-coded building data)
        └── CDK Overlay → BuildingPanelComponent (opened on landmark click)
```

### Components & Services

**`AppComponent`**
- Root shell. Renders `MapComponent` full-screen.

**`MapComponent`**
- Initializes Mapbox GL JS map on `ngAfterViewInit`, centered on NYC (`lng: -73.985, lat: 40.748`, zoom `15.5`, pitch `45`, bearing `-17.6`).
- On map `load` event: adds city 3D building layer and custom landmark highlight layer.
- Registers a `click` event listener on the landmark layer. On click: looks up the building via `BuildingService`, then opens/replaces the CDK overlay panel.
- Destroys map and disposes overlay on `ngOnDestroy`.

**`BuildingService`**
- Provides a readonly array of `Building` objects (hard-coded).
- Exposes `getById(id: string): Building | undefined` for lookup by landmark ID.

**`BuildingPanelComponent`**
- Standalone Angular component rendered inside a CDK `OverlayRef`.
- Accepts a `Building` input via `@Input()`.
- Emits a `close` event (captured by `MapComponent` to dispose the overlay).
- Layout: `mat-toolbar` (name + close button) → `mat-list` (address, floors, year built, owner, geocode) → `mat-card` (description).

---

## Map Layers

### Layer 1 — City 3D Buildings
- **Source:** Mapbox `composite` tileset, `building` source layer
- **Type:** `fill-extrusion`
- **Color:** `#aaaaaa` (neutral grey)
- **Height:** driven by `building-height` and `building-min-height` data properties
- **Visibility:** shown at zoom ≥ 15

### Layer 2 — Landmark Highlight Layer
- **Source:** Same `composite` / `building` source layer
- **Type:** `fill-extrusion`
- **Filter:** `['in', 'id', ...landmarkMapboxIds]` — only renders the 5 landmark features
- **Color:** `#f5a623` (amber/gold)
- **Height:** same as Layer 1
- **Click events:** registered on this layer only

> Note: Mapbox OSM feature IDs for the 5 landmarks will be identified during implementation by inspecting the map at the target coordinates using `queryRenderedFeatures`.

---

## Side Panel (CDK Overlay)

- **Position:** `GlobalPositionStrategy` — right edge of viewport, full viewport height
- **Width:** `400px` (desktop); `100vw` (mobile via CSS media query)
- **Backdrop:** transparent CDK backdrop; clicking it closes the panel
- **Animation:** CSS slide-in from right (`translateX(100%)` → `translateX(0)`), 250ms ease-out
- **One panel at a time:** opening a second panel disposes the existing `OverlayRef` before creating a new one
- **Close triggers:** close button (mat-icon-button) inside the panel toolbar, or backdrop click

### Panel Field Layout

| Field | Display |
|---|---|
| Building Name | `mat-toolbar` title |
| Address | `mat-list-item` with location icon |
| Number of Floors | `mat-list-item` with building icon |
| Year Built | `mat-list-item` with calendar icon |
| Owner | `mat-list-item` with person icon |
| Geocode (lat/lng) | `mat-list-item` with map-pin icon |
| Description | `mat-card` body text |

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Mapbox token missing/invalid | `mat-snack-bar` error: "Map failed to load. Please check configuration." Shown on map `error` event. |
| Landmark clicked but not found in service | Silently ignored — no panel opens |

---

## Testing

| Target | Test type | What is verified |
|---|---|---|
| `BuildingService` | Unit | All 5 buildings have every required field populated; `getById` returns correct building |
| `MapComponent` | Unit (Mapbox mocked) | Click handler calls `BuildingService.getById` and opens overlay |
| `BuildingPanelComponent` | Unit | All building fields render in the DOM given a mock `Building` input |

---

## Out of Scope (v1)

- Real-time or API-fetched building data
- Search or filter UI
- Mobile-specific map gestures beyond defaults
- e2e / Cypress tests
