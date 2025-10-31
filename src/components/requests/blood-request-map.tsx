"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

type BloodRequestMapPoint = {
  id: number;
  patientName: string;
  hospitalName: string;
  bloodGroup: string;
  urgencyStatus: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type BloodRequestMapProps = {
  requests: BloodRequestMapPoint[];
  className?: string;
};

const DEFAULT_CENTER: [number, number] = [23.777176, 90.399452];

export function BloodRequestMap({ requests, className }: BloodRequestMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function ensureLeaflet() {
      if (leafletRef.current) {
        return leafletRef.current;
      }

      const L = await import("leaflet");

      // Align marker icons with CDN assets because Next image optimization interferes with Leaflet defaults.
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      leafletRef.current = L;
      return L;
    }

    async function initializeMap() {
      if (!containerRef.current) {
        return;
      }

      const L = await ensureLeaflet();
      if (!isMounted || !L) {
        return;
      }

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: 7,
          zoomControl: false,
          attributionControl: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current);

        L.control.zoom({ position: "bottomright" }).addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;
      if (!map) {
        return;
      }

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const points = requests.filter(
        (request) => typeof request.latitude === "number" && typeof request.longitude === "number",
      );

      if (points.length === 0) {
        map.setView(DEFAULT_CENTER, 6);
        return;
      }

      const bounds = L.latLngBounds([]);

      points.forEach((point) => {
        const marker = L.marker([point.latitude as number, point.longitude as number], {
          title: point.patientName,
        });

        const popupHtml = `
          <div class="space-y-1">
            <p class="text-sm font-semibold">${point.patientName}</p>
            <p class="text-xs">${point.hospitalName}</p>
            <p class="text-xs">Blood group: ${point.bloodGroup}</p>
            <p class="text-xs">Urgency: ${point.urgencyStatus}</p>
            ${point.location ? `<p class="text-xs text-slate-600">${point.location}</p>` : ""}
          </div>
        `;

        marker.bindPopup(popupHtml, { className: "leaflet-popup-content-wrapper" });
        marker.addTo(map);
        markersRef.current.push(marker);
        bounds.extend(marker.getLatLng());
      });

      map.fitBounds(bounds.pad(0.25));
    }

    void initializeMap();

    return () => {
      isMounted = false;
    };
  }, [requests]);

  return <div ref={containerRef} className={className ?? "h-full w-full rounded-3xl"} />;
}

export type { BloodRequestMapPoint };
