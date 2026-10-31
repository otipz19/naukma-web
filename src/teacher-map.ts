import * as L from "leaflet";
import { Coordinates } from "./teacher.js";

const TILES_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILES_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_ZOOM = 5;

let map: L.Map | null = null;
let marker: L.Marker | null = null;

export function showTeacherLocation(container: HTMLElement, coordinates: Coordinates, label: string): void {
    const position = L.latLng(Number(coordinates.latitude), Number(coordinates.longitude));
    if (map === null || marker === null) {
        map = L.map(container);
        L.tileLayer(TILES_URL, { maxZoom: 19, attribution: TILES_ATTRIBUTION }).addTo(map);
        marker = L.marker(position).addTo(map);
    }
    const popup = document.createElement("span");
    popup.textContent = label;
    marker.setLatLng(position).bindPopup(popup);
    map.invalidateSize();
    map.setView(position, DEFAULT_ZOOM);
}
