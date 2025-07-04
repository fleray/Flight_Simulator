import React, { useState, useMemo, useRef, useEffect, ChangeEvent } from 'react'
import './App.css'
import { PathLayer, TextLayer } from '@deck.gl/layers'
import { OBJLoader } from '@loaders.gl/obj'
import { registerLoaders } from '@loaders.gl/core'
import { PlaneTrajectoryComputation, AdsbJson } from './model/PlaneTrajectory'
import { PlaneLayer } from './view/PlaneLayer'
import { MapView } from './view/MapView'
import { Controls } from './view/Controls'
import { interpolate } from 'd3-interpolate'

registerLoaders([OBJLoader])

// CartoDB Positron style
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

// Place your glTF model here
const AIRCRAFT_MODEL_URL = '/public/11803_Airplane_v1_l1.obj'

// Mock icon for aircraft (can be replaced with a better one)
const AIRCRAFT_ICON = 'https://cdn-icons-png.flaticon.com/512/69/69906.png'

// Fallback mock data in the new format
const mockAdsbData: AdsbJson = {
  icao: '000000',
  version: 'mock',
  timestamp: 0,
  trace: [
    [0, 48.85, 2.35, 1000, 0, 0],
    [10, 48.86, 2.36, 1200, 50, 45],
    [20, 48.87, 2.37, 1400, 100, 90],
    [30, 48.88, 2.38, 1300, 120, 135],
    [40, 48.89, 2.39, 1100, 80, 180],
  ]
}

// Interpolate aircraft state at a given timestamp
function interpolateAircraft(aircraft: any[], timestamp: number) {
  if (aircraft.length === 0) return null;
  if (timestamp <= aircraft[0].timestamp) return aircraft[0];
  if (timestamp >= aircraft[aircraft.length - 1].timestamp) return aircraft[aircraft.length - 1];

  let prev = aircraft[0], next = aircraft[0];
  for (let i = 1; i < aircraft.length; i++) {
    if (aircraft[i].timestamp >= timestamp) {
      prev = aircraft[i - 1];
      next = aircraft[i];
      break;
    }
  }
  const t = (timestamp - prev.timestamp) / (next.timestamp - prev.timestamp);

  // Use d3-interpolate for position, bearing, and pitch
  const interpLon = interpolate(prev.lon, next.lon)(t);
  const interpLat = interpolate(prev.lat, next.lat)(t);
  const interpAlt = interpolate(prev.alt, next.alt)(t);
  const interpBearing = interpolate(prev.bearing, next.bearing)(t);
  const interpPitch = interpolate(prev.pitch, next.pitch)(t);

  return {
    ...prev,
    lon: interpLon,
    lat: interpLat,
    alt: interpAlt,
    bearing: interpBearing,
    pitch: interpPitch,
    position: [interpLon, interpLat, interpAlt]
  };
}

function App() {
  const [adsbData, setAdsbData] = useState<AdsbJson | null>(null)
  const [error, setError] = useState<string | null>(null)

  const INITIAL_VIEW_STATE = {
    longitude: 2.3522,   // Paris longitude
    latitude: 48.8566,   // Paris latitude
    zoom: 12,            // Adjust zoom as needed for city view
    pitch: 85,
    bearing: 0
  }

  const [viewState, setViewState] = useState({ ...INITIAL_VIEW_STATE })
  const [timestamp, setTimestamp] = useState(0)

  // Handle file upload and parse JSON
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        setAdsbData(json)
        setError(null)
        setTimestamp(0)
      } catch (err) {
        setError('Invalid JSON file.')
        setAdsbData(null)
      }
    }
    reader.readAsText(file)
  }

  // Compute trajectory and aircraft points
  const { trajectory, aircraft } = useMemo(() => {
    return PlaneTrajectoryComputation.computeTrajectory(adsbData || mockAdsbData)
  }, [adsbData])

  // Find min and max timestamp for the slider
  const minTS = aircraft.length > 0 ? aircraft[0].timestamp : 0;
  const maxTS = aircraft.length > 0 ? aircraft[aircraft.length - 1].timestamp : 0;

  // Interpolated aircraft point for current timestamp
  const interpolatedAircraft = interpolateAircraft(aircraft, timestamp);
  const current = interpolatedAircraft || {};

  // Dynamic size scale for zoom-independent model size
  const REFERENCE_ZOOM = 16
  const BASE_SIZE_SCALE = 0.015
  const zoomScale = Math.pow(2, viewState.zoom - REFERENCE_ZOOM)
  const adjustedSizeScale = BASE_SIZE_SCALE / zoomScale

  // Deck.gl layers
  const layers = [
    new PathLayer({
      id: 'trajectory',
      data: [{ path: trajectory }],
      getPath: (d: any) => d.path,
      getColor: [0, 128, 255],
      widthScale: 10,
      widthMinPixels: 3,
      getWidth: 2,
      opacity: 0.8,
      rounded: true,
    }),
    new TextLayer({
      id: 'trajectory-labels',
      data: aircraft,
      getPosition: (d: any) => d.position,
      getText: (_: any, { index }: { index: number }) => String(index + 1),
      getSize: 16,
      getColor: [0, 0, 0, 255],
      getAngle: 0,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      sizeUnits: 'pixels',
      pickable: false,
    }),
    new PlaneLayer({
      aircraftPoint: interpolatedAircraft,
      modelUrl: AIRCRAFT_MODEL_URL,
      sizeScale: adjustedSizeScale,
    }),
  ]

  return (
    <div className="App" style={{ padding: 20 }}>

      <div style={{ height: '70vh', marginTop: 10, border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
        <MapView
          layers={layers}
          viewState={viewState}
          onViewStateChange={({ viewState }: { viewState: typeof INITIAL_VIEW_STATE }) => setViewState(viewState)}
        />
      </div>
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10
      }}>
        <Controls
          aircraft={aircraft}
          minTS={minTS}
          maxTS={maxTS}
          error={error}
          handleFileChange={handleFileChange}
          current={current}
          onTimestampChange={setTimestamp}
        />
      </div>
    </div>
  )
}

export default App
