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
