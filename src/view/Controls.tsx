import React, { ChangeEvent } from 'react';

interface ControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    currentIdx: number;
    setCurrentIdx: (idx: number) => void;
    aircraft: any[];
    error: string | null;
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    current: any;
}

export const Controls: React.FC<ControlsProps> = ({
    isPlaying,
    onPlayPause,
    currentIdx,
    setCurrentIdx,
    aircraft,
    error,
    handleFileChange,
    current
}) => (
    <div style={{ margin: '10px 0' }}>
        <h1>Flight Trajectory Visualizer</h1>
        <input type="file" accept="application/json" onChange={handleFileChange} style={{ marginBottom: 10 }} />
        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
        <button onClick={onPlayPause} disabled={aircraft.length <= 1}>
            {isPlaying ? 'Pause' : 'Play'}
        </button>
        <input
            type="range"
            min={0}
            max={aircraft.length - 1}
            value={currentIdx}
            onChange={e => { setCurrentIdx(Number(e.target.value)); }}
            style={{ width: 300, marginLeft: 10 }}
            disabled={aircraft.length <= 1}
        />
        <span style={{ marginLeft: 10 }}>
            {current.timestamp !== undefined ? `Timestamp: ${current.timestamp}` : ''}
            {current.speed !== undefined ? ` | Speed: ${current.speed?.toFixed(1)} m/s` : ''}
            {current.alt !== undefined ? ` | Altitude: ${current.alt} m` : ''}
            {current.bearing !== undefined ? ` | Bearing: ${current.bearing?.toFixed(1)}°` : ''}
            {current.pitch !== undefined ? ` | Pitch: ${current.pitch?.toFixed(1)}°` : ''}
        </span>
    </div>
); 