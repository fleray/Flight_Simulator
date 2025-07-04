export interface AdsbTraceRow {
    timestamp: number;
    lat: number;
    lon: number;
    alt: number;
    speed: number | null;
    heading: number | null;
    raw: any[];
    bearing?: number;
    pitch?: number;
    position?: [number, number, number];
}

export interface AdsbJson {
    icao: string;
    version: string;
    timestamp: number;
    trace: any[][];
}

export class PlaneTrajectoryComputation {
    static computeBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const toDeg = (rad: number) => (rad * 180) / Math.PI;
        const dLon = toRad(lon2 - lon1);
        const y = Math.sin(dLon) * Math.cos(toRad(lat2));
        const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
        return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }

    static computePitch(lat1: number, lon1: number, alt1: number, lat2: number, lon2: number, alt2: number): number {
        const R = 6371000;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const groundDist = R * c;
        const altDiff = alt2 - alt1;
        return Math.atan2(altDiff, groundDist) * (180 / Math.PI);
    }

    static computeSpeed(lat1: number, lon1: number, alt1: number, t1: number, lat2: number, lon2: number, alt2: number, t2: number): number {
        const R = 6371000;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const groundDist = R * c;
        const altDiff = alt2 - alt1;
        const dist = Math.sqrt(groundDist ** 2 + altDiff ** 2);
        const dt = t2 - t1;
        return dt > 0 ? dist / dt : 0;
    }

    static parseAdsbTraceData(json: AdsbJson | null): AdsbTraceRow[] {
        if (!json || !Array.isArray(json.trace)) return [];
        const rootTimestamp = typeof json.timestamp === 'number' ? json.timestamp : 0;
        return json.trace.map((row) => {
            const seconds = typeof row[0] === 'number' ? row[0] : 0;
            return {
                timestamp: rootTimestamp + seconds,
                lat: row[1],
                lon: row[2],
                alt: typeof row[3] === 'number' ? row[3] : 0,
                speed: typeof row[4] === 'number' ? row[4] : null,
                heading: typeof row[5] === 'number' ? row[5] : null,
                raw: row
            };
        });
    }

    static computeTrajectory(adsbData: AdsbJson | null) {
        const data = this.parseAdsbTraceData(adsbData);
        const path = data.map((d) => [d.lon, d.lat, d.alt || 0] as [number, number, number]);
        const aircraftPoints = data.map((d, i) => {
            let bearing = d.heading ?? 0, pitch = 0, speed = d.speed ?? 0;
            if (i < data.length - 1) {
                const next = data[i + 1];
                if (d.heading == null) bearing = this.computeBearing(d.lat, d.lon, next.lat, next.lon);
                pitch = this.computePitch(d.lat, d.lon, d.alt || 0, next.lat, next.lon, next.alt || 0);
                if (d.speed == null) speed = this.computeSpeed(d.lat, d.lon, d.alt || 0, d.timestamp, next.lat, next.lon, next.alt || 0, next.timestamp);
            }
            return {
                ...d,
                bearing,
                pitch,
                speed,
                position: [d.lon, d.lat, d.alt || 0] as [number, number, number],
            };
        });
        const minTimestamp = data[0]?.timestamp || 0;
        const maxTimestamp = data[data.length - 1]?.timestamp || 0;
        return { trajectory: path, aircraft: aircraftPoints, minTimestamp, maxTimestamp };
    }
} 