import React from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

interface MapViewProps {
    layers: any[];
    viewState: any;
    onViewStateChange: (args: any) => void;
}

export const MapView: React.FC<MapViewProps> = ({ layers, viewState, onViewStateChange }) => (
    <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        onViewStateChange={onViewStateChange}
    >
        <Map
            mapLib={maplibregl}
            mapStyle={MAP_STYLE}
            width="100%"
            height="100%"
            reuseMaps
        />
    </DeckGL>
); 