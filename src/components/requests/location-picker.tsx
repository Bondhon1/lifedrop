"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import "leaflet/dist/leaflet.css";

import type { Icon, LeafletMouseEvent, Map as LeafletMap, Marker } from "leaflet";

import type { BloodRequestFormInput } from "@/lib/validators/blood-request";

type LocationPickerProps = {
  onError?: (message: string) => void;
};

type ResolveLocationResponse = {
  divisionId: number | null;
  districtId: number | null;
  upazilaId: number | null;
};

const DEFAULT_CENTER: [number, number] = [23.8103, 90.4125];
const DEFAULT_ZOOM = 12;

export function LocationPicker({ onError }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const iconRef = useRef<Icon | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const { setValue, watch } = useFormContext<BloodRequestFormInput>();
  const addressLabel = watch("addressLabel");

  const [isMapReady, setIsMapReady] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const ensureMarker = useCallback(
    (coords: [number, number]) => {
      const L = leafletRef.current;
      if (!L || !mapInstanceRef.current) {
        return;
      }

      if (!markerRef.current) {
        markerRef.current = L.marker(coords, { icon: iconRef.current ?? undefined }).addTo(mapInstanceRef.current);
      } else {
        markerRef.current.setLatLng(coords);
      }

      mapInstanceRef.current.flyTo(coords, Math.max(mapInstanceRef.current.getZoom(), 14), { duration: 0.35 });
    },
    [],
  );

  const assignResolvedLocation = useCallback(
    (resolved: ResolveLocationResponse) => {
      const divisionValue = resolved.divisionId ? String(resolved.divisionId) : "";
      const districtValue = resolved.districtId ? String(resolved.districtId) : "";
      const upazilaValue = resolved.upazilaId ? String(resolved.upazilaId) : "";

      setValue("divisionId", divisionValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("districtId", districtValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("upazilaId", upazilaValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const resolveAdministrativeArea = useCallback(
    async (latitude: number, longitude: number, address?: { state?: string; district?: string; upazila?: string }) => {
      try {
        const response = await fetch("/api/geo/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, address }),
        });

        if (!response.ok) {
          throw new Error("Unable to match the selected location to a division/district");
        }

        const payload = (await response.json()) as ResolveLocationResponse;
        assignResolvedLocation(payload);
      } catch (error) {
        if (onError) {
          const message = error instanceof Error ? error.message : "Failed to resolve administrative area";
          onError(message);
        }
      }
    },
    [assignResolvedLocation, onError],
  );

  const handleSelection = useCallback(
    async (lat: number, lng: number) => {
      const L = leafletRef.current;
      if (!L) {
        return;
      }

      const coordinateLabel = `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;

      setValue("latitude", String(lat), {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("longitude", String(lng), {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("addressLabel", coordinateLabel, {
        shouldDirty: true,
        shouldValidate: false,
      });
      setValue("location", coordinateLabel, {
        shouldDirty: true,
        shouldValidate: true,
      });

      ensureMarker([lat, lng]);
      assignResolvedLocation({ divisionId: null, districtId: null, upazilaId: null });

      setIsResolving(true);
      try {
        const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
        reverseUrl.searchParams.set("format", "jsonv2");
        reverseUrl.searchParams.set("lat", String(lat));
        reverseUrl.searchParams.set("lon", String(lng));
        reverseUrl.searchParams.set("zoom", "16");
        reverseUrl.searchParams.set("addressdetails", "1");

        const response = await fetch(reverseUrl.toString(), {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to look up address for the selected point");
        }

        const data: {
          display_name?: string;
          address?: {
            state?: string;
            county?: string;
            district?: string;
            city?: string;
            town?: string;
            village?: string;
            municipality?: string;
            suburb?: string;
            neighbourhood?: string;
            road?: string;
            hamlet?: string;
            quarter?: string;
            hospital?: string;
            clinic?: string;
            medical?: string;
            doctors?: string;
            amenity?: string;
          };
        } = await response.json();

        const label = data.display_name ?? "";
        const normalizedLabel = label.trim();

        const deriveLocationText = () => {
          const address = data.address;
          if (!address) {
            return normalizedLabel;
          }

          const hospital = address.hospital ?? address.clinic ?? address.medical ?? address.doctors ?? address.amenity;
          const street = address.road ?? address.neighbourhood ?? address.suburb ?? address.quarter;
          const city = address.city ?? address.town ?? address.municipality ?? address.village ?? address.hamlet;
          const district = address.district ?? address.county;
          const state = address.state;

          const parts = [hospital, street, city, district, state]
            .map((part) => (typeof part === "string" ? part.trim() : ""))
            .filter((part) => part.length > 0);

          if (parts.length === 0) {
            return normalizedLabel;
          }

          const deduped: string[] = [];
          for (const part of parts) {
            if (!deduped.some((existing) => existing.localeCompare(part, undefined, { sensitivity: "base" }) === 0)) {
              deduped.push(part);
            }
          }

          return deduped.join(", ");
        };

        const locationText = deriveLocationText();
        const finalLocation = locationText.length > 0 ? locationText : coordinateLabel;

        setValue("addressLabel", finalLocation, {
          shouldDirty: true,
          shouldValidate: false,
        });
        setValue("location", finalLocation, {
          shouldDirty: true,
          shouldValidate: true,
        });

        await resolveAdministrativeArea(lat, lng, {
          state: data.address?.state,
          district: data.address?.district ?? data.address?.county,
          upazila:
            data.address?.city ??
            data.address?.town ??
            data.address?.municipality ??
            data.address?.village ??
            data.address?.suburb,
        });
      } catch (error) {
        if (onError) {
          const message = error instanceof Error ? error.message : "Unable to process the selected location";
          onError(message);
        }
        setValue("location", coordinateLabel, {
          shouldDirty: true,
          shouldValidate: true,
        });
      } finally {
        setIsResolving(false);
      }
    },
    [assignResolvedLocation, ensureMarker, onError, resolveAdministrativeArea, setValue],
  );

  useEffect(() => {
    let isMounted = true;

    async function initialiseMap() {
      const L = await import("leaflet");
      if (!isMounted || !containerRef.current) {
        return;
      }

      leafletRef.current = L;
      iconRef.current = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconAnchor: [12, 41],
      });

      const map = L.map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      map.on("click", (event: LeafletMouseEvent) => {
        handleSelection(event.latlng.lat, event.latlng.lng);
      });

      setIsMapReady(true);
    }

    initialiseMap().catch((error) => {
      if (onError) {
        const message = error instanceof Error ? error.message : "Failed to initialise map";
        onError(message);
      }
    });

    return () => {
      isMounted = false;
      mapInstanceRef.current?.off();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [handleSelection, onError]);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      onError?.("Geolocation is not supported by this browser");
      return;
    }

    setIsResolving(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleSelection(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setIsResolving(false);
        onError?.(error.message || "Unable to fetch current location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [handleSelection, onError]);

  return (
    <div className="space-y-3">
      <div className="relative h-72 w-full overflow-hidden rounded-md border border-rose-500/40 bg-rose-950/40">
        <div ref={containerRef} className="absolute inset-0" />
        {!isMapReady ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-rose-100/80">Loading map…</div>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 text-xs text-rose-100/80 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">
          {addressLabel ? `Selected location: ${addressLabel}` : "Tap anywhere on the map to set the hospital location."}
        </p>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="self-start rounded-md border border-rose-400/70 px-3 py-1 text-rose-100 transition hover:bg-rose-500/10"
          disabled={isResolving}
        >
          {isResolving ? "Locating…" : "Use current location"}
        </button>
      </div>
    </div>
  );
}
