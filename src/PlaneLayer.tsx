import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import React from 'react';

interface PlaneLayerProps {
    aircraftPoint: any;
    modelUrl: string;
    sizeScale: number;
}

export class PlaneLayer extends SimpleMeshLayer {
    constructor({ aircraftPoint, modelUrl, sizeScale }: PlaneLayerProps) {
        super({
            id: 'aircraft-3d',
            data: [aircraftPoint],
            mesh: modelUrl,
            getPosition: (d: any) => d.position,
            getOrientation: (d: any) => [d.pitch || 0, -(d.bearing || 0), 0],
            sizeScale,
            getColor: [255, 255, 0], // "Trump" plane color ;)
            pickable: true,
            visible: true,
        });
    }
} 