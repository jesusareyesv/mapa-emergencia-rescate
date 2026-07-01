"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

const redDot = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;background:#c41a1a;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,0.45)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      style={{ height: "192px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={[lat, lng]} icon={redDot} />
    </MapContainer>
  );
}
