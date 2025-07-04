import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

interface ControlsProps {
    aircraft: any[];
    minTS: number;
    maxTS: number;
    error: string | null;
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    current: any;
    onTimestampChange: (timestamp: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
    aircraft,
    minTS,
    maxTS,
    error,
    handleFileChange,
    current,
    onTimestampChange
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [timestamp, setTimestamp] = useState(minTS);
    const animationRef = useRef<NodeJS.Timeout | null>(null);

    // Keep timestamp in range if minTS/maxTS change
    useEffect(() => {
        setTimestamp(ts => {
            if (ts < minTS) return minTS;
            if (ts > maxTS) return maxTS;
            return ts;
        });
    }, [minTS, maxTS]);

    // Animation effect: increment timestamp by 2s per tick
    useEffect(() => {
        if (isPlaying) {
            animationRef.current = setInterval(() => {
                setTimestamp(ts => {
                    if (ts + 1 >= maxTS) {
                        setIsPlaying(false);
                        return maxTS;
                    }
                    return ts + 1;
                });
            }, 100);
        } else if (animationRef.current) {
            clearInterval(animationRef.current);
        }
        return () => { if (animationRef.current) clearInterval(animationRef.current); };
    }, [isPlaying, maxTS]);

    // Notify parent of timestamp change
    useEffect(() => {
        onTimestampChange(timestamp);
    }, [timestamp, onTimestampChange]);

    const togglePlay = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPlaying(false);
        setTimestamp(Number(e.target.value));
    }, []);

    return (
        <div style={{ margin: '10px 0', display: 'flex', alignItems: 'center' }}>
            <input type="file" accept="application/json" onChange={handleFileChange} style={{ marginBottom: 10, marginRight: 20 }} />
            {error && <div style={{ color: 'red', marginBottom: 10, marginRight: 20 }}>{error}</div>}
            <button
                onClick={togglePlay}
                style={{
                    height: '33px',
                    width: '33px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    background: '#f8f8f8',
                    color: '#333',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '10px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    cursor: 'pointer'
                }}
            >
                {isPlaying ? '⏸️' : '▶️'}
            </button>
            <input
                type="range"
                min={minTS}
                max={maxTS}
                value={timestamp}
                onChange={handleSliderChange}
                style={{ width: '400px' }}
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
}; 