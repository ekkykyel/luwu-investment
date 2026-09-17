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

const DrawControl = forwardRef<DrawControlRef, DrawControlProps>((props, ref) => {
  const drawInstance = useRef(new MapboxDraw({
    ...props,
    styles: (props.styles || (MapboxDraw as any).lib?.theme || []).map((style: any) => {
      if (style.paint && style.paint['line-dasharray']) {
        delete style.paint['line-dasharray']; // Fix maplibre layer crash by completely removing dasharray from draw theme
      }
      return style;
    })
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
