# Flight Trajectory Visualizer

This project is a **3D flight trajectory visualizer for a given plane**.

## Purpose
Upload a JSON file containing ADS-B flight data for a specific aircraft. The app animates the plane's path on a map, showing its position, orientation (bearing and pitch), and step-by-step trajectory.

## Features
- Displays the aircraft's trajectory as a path on a map
- Animates a 3D model of the plane moving along the path, oriented according to real flight data
- Shows step numbers at each trajectory point
- Provides play/pause controls and a slider to scrub through the flight
- Lets you upload your own ADS-B data for any flight

## Tech Stack
- React
- Deck.gl
- MapLibre
- 3D rendering for the aircraft and interactive map visualization

## Development

This project uses [Parcel](https://parceljs.org/) as the build tool.

### To run locally:

```sh
npm install
npm run start
```

Then open the provided localhost URL in your browser.

**In short:**
It's an interactive tool to visualize and animate the real-world flight path of a plane in 3D, using real ADS-B data.
