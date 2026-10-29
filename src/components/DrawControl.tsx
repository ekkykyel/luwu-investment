import { useControl } from 'react-map-gl/maplibre';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { ControlPosition } from 'react-map-gl/maplibre';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { forwardRef, useImperativeHandle, useRef } from 'react';

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition;

  onCreate?: (evt: { features: object[] }) => void;
  onUpdate?: (evt: { features: object[]; action: string }) => void;
  onDelete?: (evt: { features: object[] }) => void;
};

export interface DrawControlRef {
  draw: MapboxDraw;
}

// Ultra high-visibility theme for polygon & line editing across dark satellite & light basemaps
const HIGH_VISIBILITY_DRAW_THEME = [
  // 1. Polygon Fill Active
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'active', 'true']],
    paint: {
      'fill-color': '#a855f7',
      'fill-opacity': 0.25
    }
  },
  // 2. Polygon Fill Inactive
  {
    id: 'gl-draw-polygon-fill-inactive',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'active', 'false']],
    paint: {
      'fill-color': '#3b82f6',
      'fill-opacity': 0.15
    }
  },
  // 3. Lines & Polygon Boundary Active
  {
    id: 'gl-draw-line-active',
    type: 'line',
    filter: ['all', ['==', 'active', 'true']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    } as any,
    paint: {
      'line-color': '#ec4899',
      'line-width': 3.5
    }
  },
  // 4. Lines & Polygon Boundary Inactive
  {
    id: 'gl-draw-line-inactive',
    type: 'line',
    filter: ['all', ['==', 'active', 'false']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    } as any,
    paint: {
      'line-color': '#8b5cf6',
      'line-width': 2.5
    }
  },
  // 5. Active Vertex Outer Ring / Halo (Crisp White Glow)
  {
    id: 'gl-draw-vertex-halo',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex']],
    paint: {
      'circle-radius': 8.5,
      'circle-color': '#ffffff',
      'circle-opacity': 1.0,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#0f172a'
    }
  },
  // 6. Active Vertex Inner Core (Amber Accent for high contrast)
  {
    id: 'gl-draw-vertex-inner',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex']],
    paint: {
      'circle-radius': 5.5,
      'circle-color': '#f59e0b',
      'circle-opacity': 1.0
    }
  },
  // 7. Midpoint Handle (Add-Vertex Handle)
  {
    id: 'gl-draw-midpoint',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'midpoint']],
    paint: {
      'circle-radius': 5,
      'circle-color': '#06b6d4',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#ffffff'
    }
  },
  // 8. General Point Features
  {
    id: 'gl-draw-point-outer',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
    paint: {
      'circle-radius': 8,
      'circle-color': '#ffffff',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#0f172a'
    }
  },
  {
    id: 'gl-draw-point-inner',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
    paint: {
      'circle-radius': 5.5,
      'circle-color': '#9333ea'
    }
  }
];

const DrawControl = forwardRef<DrawControlRef, DrawControlProps>((props, ref) => {
  const drawInstance = useRef(new MapboxDraw({
    ...props,
    styles: props.styles || HIGH_VISIBILITY_DRAW_THEME
  }));

  useControl<any>(
    () => drawInstance.current,
    ({ map }) => {
      if (props.onCreate) map.on('draw.create', props.onCreate);
      if (props.onUpdate) map.on('draw.update', props.onUpdate);
      if (props.onDelete) map.on('draw.delete', props.onDelete);
    },
    ({ map }) => {
      if (props.onCreate) map.off('draw.create', props.onCreate);
      if (props.onUpdate) map.off('draw.update', props.onUpdate);
      if (props.onDelete) map.off('draw.delete', props.onDelete);
    },
    {
      position: props.position
    }
  );

  useImperativeHandle(ref, () => ({
    draw: drawInstance.current
  }), []);

  return null;
});

export default DrawControl;
