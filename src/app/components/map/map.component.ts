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
      data: LANDMARK_FOOTPRINTS as any,
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
