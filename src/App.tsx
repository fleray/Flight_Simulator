import React, { useState, useMemo, useRef, useEffect, ChangeEvent } from 'react'
import './App.css'
import { PathLayer, TextLayer } from '@deck.gl/layers'
import { OBJLoader } from '@loaders.gl/obj'
import { registerLoaders } from '@loaders.gl/core'
import { PlaneTrajectoryComputation, AdsbJson } from './model/PlaneTrajectory'
import { PlaneLayer } from './view/PlaneLayer'
import { MapView } from './view/MapView'
import { Controls } from './view/Controls'

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

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
        setCurrentIdx(0)
        setIsPlaying(false)
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

  // Animation effect
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setInterval(() => {
        setCurrentIdx((idx) => {
          if (idx < aircraft.length - 1) {
            return idx + 1
          } else {
            setIsPlaying(false)
            return idx
          }
        })
      }, 500) // Adjust speed as needed
    } else if (animationRef.current) {
      clearInterval(animationRef.current)
    }
    return () => { if (animationRef.current) clearInterval(animationRef.current); }
  }, [isPlaying, aircraft.length])

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
      aircraftPoint: aircraft[currentIdx],
      modelUrl: AIRCRAFT_MODEL_URL,
      sizeScale: adjustedSizeScale,
    }),
  ]

  // UI for animation controls and flight data
  const current = aircraft[currentIdx] || {}

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
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying((p) => !p)}
          currentIdx={currentIdx}
          setCurrentIdx={idx => { setCurrentIdx(idx); setIsPlaying(false); }}
          aircraft={aircraft}
          error={error}
          handleFileChange={handleFileChange}
          current={current}
        />
      </div>
    </div>
  )
}

export default App
