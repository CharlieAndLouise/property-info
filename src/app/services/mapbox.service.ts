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
