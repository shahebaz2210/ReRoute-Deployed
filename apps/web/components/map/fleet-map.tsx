"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Truck,
  MapPin,
  Maximize2,
  Navigation,
  Building2,
  Layers,
  CheckCircle,
} from "lucide-react";

export interface GeoMarker {
  id: string;
  type: "DEPOT" | "STOP" | "VEHICLE" | "INCIDENT";
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  status?: string;
  vehicleCode?: string;
  orderRef?: string;
  stopNumber?: number;
  color?: string; // Color matching corresponding fleet route
}

export interface GeoRoute {
  id: string;
  vehicleCode?: string;
  driverName?: string;
  color: string;
  coordinates: [number, number][]; // [lat, lng] array
  distanceKm?: number;
  stopsCount?: number;
}

// Legacy format compatibility
export interface MapMarker {
  id: string;
  type: "VEHICLE" | "STOP" | "INCIDENT" | "BLOCKED_ROAD";
  x: number;
  y: number;
  label: string;
  status?: string;
  vehicleCode?: string;
  orderRef?: string;
  stopNumber?: number;
  lat?: number;
  lng?: number;
  color?: string;
}

export interface RouteLine {
  id: string;
  type: "COMMITTED" | "PROPOSED" | "COMPLETED";
  color: string;
  points: { x: number; y: number }[];
  coordinates?: [number, number][];
}

interface FleetMapProps {
  markers?: MapMarker[];
  routes?: RouteLine[];
  geoMarkers?: GeoMarker[];
  geoRoutes?: GeoRoute[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  className?: string;
}

// Default Depot: Swargate Multimodal Hub & Depot Center, Pune, Maharashtra, India
// Exact Coordinates: Latitude 18.5018° N, Longitude 73.8586° E
const DEFAULT_INDIA_LAT = 18.5018;
const DEFAULT_INDIA_LNG = 73.8586;

export function FleetMap({
  markers,
  routes,
  geoMarkers,
  geoRoutes,
  centerLat = DEFAULT_INDIA_LAT,
  centerLng = DEFAULT_INDIA_LNG,
  zoom = 12,
  className = "",
}: FleetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeRegion, setActiveRegion] = useState<string>("Pune (Swargate)");

  // Normalize all markers to geographic lat/lng
  const effectiveGeoMarkers: GeoMarker[] = React.useMemo(() => {
    if (geoMarkers && geoMarkers.length > 0) return geoMarkers;

    // Convert legacy markers if lat/lng are provided or map to Swargate Pune region
    if (markers && markers.length > 0) {
      return markers.map((m) => {
        // If explicit lat/lng are on the marker, use them
        if (typeof m.lat === "number" && typeof m.lng === "number") {
          return {
            id: m.id,
            type: m.type === "VEHICLE" ? "VEHICLE" : m.stopNumber === 0 ? "DEPOT" : "STOP",
            lat: m.lat,
            lng: m.lng,
            label: m.label,
            status: m.status,
            vehicleCode: m.vehicleCode,
            orderRef: m.orderRef,
            stopNumber: m.stopNumber,
            color: m.color,
          };
        }
        // Fallback India-spread coordinates around Swargate Pune hub
        const spreadLat = DEFAULT_INDIA_LAT + (m.y - 50) * 0.003;
        const spreadLng = DEFAULT_INDIA_LNG + (m.x - 50) * 0.003;
        return {
          id: m.id,
          type: m.type === "VEHICLE" ? "VEHICLE" : m.stopNumber === 0 ? "DEPOT" : "STOP",
          lat: spreadLat,
          lng: spreadLng,
          label: m.label,
          status: m.status,
          vehicleCode: m.vehicleCode,
          orderRef: m.orderRef,
          stopNumber: m.stopNumber,
          color: m.color,
        };
      });
    }

    return [];
  }, [geoMarkers, markers]);

  // Normalize all routes to geographic coordinates
  const effectiveGeoRoutes: GeoRoute[] = React.useMemo(() => {
    if (geoRoutes && geoRoutes.length > 0) return geoRoutes;

    if (routes && routes.length > 0) {
      return routes.map((r) => {
        if (r.coordinates && r.coordinates.length > 0) {
          return {
            id: r.id,
            color: r.color,
            coordinates: r.coordinates,
          };
        }
        // Fallback
        const coords: [number, number][] = r.points.map((p) => [
          DEFAULT_INDIA_LAT + (p.y - 50) * 0.003,
          DEFAULT_INDIA_LNG + (p.x - 50) * 0.003,
        ]);
        return {
          id: r.id,
          color: r.color,
          coordinates: coords,
        };
      });
    }

    return [];
  }, [geoRoutes, routes]);

  // Initialize Leaflet Map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Determine initial center
      let initialLat = centerLat;
      let initialLng = centerLng;

      if (effectiveGeoMarkers.length > 0) {
        initialLat = effectiveGeoMarkers[0].lat;
        initialLng = effectiveGeoMarkers[0].lng;
      }

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: true,
      });

      L.control.zoom({ position: "bottomleft" }).addTo(map);

      // Real OpenStreetMap Tile Layer (India & Worldwide Road Map)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    // Clear previous layers
    layersGroup.clearLayers();

    const boundsLatLngs: L.LatLngExpression[] = [];

    // 1. Draw Routes (Road Polylines on India map)
    effectiveGeoRoutes.forEach((route) => {
      if (route.coordinates && route.coordinates.length > 1) {
        const polyline = L.polyline(route.coordinates, {
          color: route.color || "#2563EB",
          weight: 4.5,
          opacity: 0.85,
          lineJoin: "round",
          lineCap: "round",
        });

        polyline.bindPopup(`
          <div style="font-family:sans-serif; padding:4px;">
            <div style="font-weight:bold; font-size:12px; color:#2D3139;">${route.vehicleCode || route.id} Active Route</div>
            <div style="font-size:11px; color:#6B7280; margin-top:2px;">
              ${route.driverName ? `Driver: ${route.driverName}<br/>` : ""}
              ${route.distanceKm ? `Distance: ${route.distanceKm} km<br/>` : ""}
              ${route.stopsCount ? `Stops: ${route.stopsCount}` : ""}
            </div>
          </div>
        `);

        layersGroup.addLayer(polyline);
        route.coordinates.forEach((c) => boundsLatLngs.push(c));
      }
    });

    // 2. Draw Markers (Depot, Stops, Vehicles on India map)
    effectiveGeoMarkers.forEach((m) => {
      boundsLatLngs.push([m.lat, m.lng]);

      let iconHtml = "";

      if (m.type === "DEPOT") {
        // Central Depot Center Pin (Dispatcher Workplace)
        iconHtml = `
          <div style="background:#1E222A; color:#FFFFFF; border:2px solid #F59E0B; border-radius:8px; padding:3px 7px; font-weight:700; font-size:10px; display:flex; align-items:center; gap:4px; box-shadow:0 3px 10px rgba(0,0,0,0.35); white-space:nowrap; transform:translate(-50%, -50%);">
            <span style="color:#F59E0B;">🏢</span>
            <span>DEPOT: ${m.label}</span>
          </div>
        `;
      } else if (m.type === "VEHICLE") {
        // Commercial Fleet Vehicle Marker matching exact route line color
        const vehicleColor = m.color || "#2563EB";
        iconHtml = `
          <div style="background:${vehicleColor}; color:#FFFFFF; border:2px solid #FFFFFF; border-radius:8px; padding:3px 8px; font-weight:800; font-size:11px; display:flex; align-items:center; gap:5px; box-shadow:0 4px 12px rgba(0,0,0,0.35); white-space:nowrap; transform:translate(-50%, -50%);">
            <span style="font-size:12px;">🚚</span>
            <span>${m.vehicleCode || m.label}</span>
          </div>
        `;
      } else {
        // Customer Delivery Stop Marker
        const isDelivered = m.status === "DELIVERED" || m.status === "COMPLETED";
        const bg = m.color || (isDelivered ? "#10B981" : "#2563EB");
        iconHtml = `
          <div style="background:${bg}; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:11px; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.25); transform:translate(-50%, -50%);">
            ${m.stopNumber ?? "#"}
          </div>
        `;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-leaflet-marker",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([m.lat, m.lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family:sans-serif; min-width:180px; padding:2px;">
          <div style="font-weight:bold; font-size:13px; color:#1F2937;">${m.label}</div>
          ${m.sublabel ? `<div style="font-size:11px; color:#6B7280; margin-top:2px;">${m.sublabel}</div>` : ""}
          <div style="margin-top:6px; font-size:11px; border-top:1px solid #E5E7EB; pt:4px;">
            <div><strong>Location:</strong> ${m.lat.toFixed(4)}° N, ${m.lng.toFixed(4)}° E</div>
            ${m.orderRef ? `<div><strong>Order:</strong> ${m.orderRef}</div>` : ""}
            ${m.status ? `<div><strong>Status:</strong> <span style="color:#059669; font-weight:600;">${m.status}</span></div>` : ""}
          </div>
        </div>
      `);

      layersGroup.addLayer(marker);
    });

    // Auto-fit bounds if we have geographic coordinates
    if (boundsLatLngs.length > 0) {
      try {
        const bounds = L.latLngBounds(boundsLatLngs);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
      } catch (err) {
        console.warn("Could not fit bounds:", err);
      }
    }
  }, [effectiveGeoMarkers, effectiveGeoRoutes, centerLat, centerLng, zoom]);

  // Clean up Leaflet on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const jumpToRegion = (name: string, lat: number, lng: number, zoomLvl: number) => {
    setActiveRegion(name);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoomLvl, { animate: true });
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const allCoords: L.LatLngExpression[] = [];
    effectiveGeoMarkers.forEach((m) => allCoords.push([m.lat, m.lng]));
    effectiveGeoRoutes.forEach((r) => r.coordinates.forEach((c) => allCoords.push(c)));
    if (allCoords.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
    }
  };

  return (
    <div className={`relative w-full rounded-xl border border-[var(--border)] shadow-xs ${className}`}>
      {/* Sticky Top Map Action Bar */}
      <div className="sticky top-18 z-[1000] m-3 inline-flex flex-wrap items-center gap-1.5 bg-[var(--surface-elevated)]/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-[var(--border)] shadow-md text-xs pointer-events-auto self-start">
        <span className="font-bold text-[var(--foreground)] flex items-center gap-1 mr-1">
          <MapPin className="h-3.5 w-3.5 text-rose-500" /> India Map:
        </span>
        <button
          onClick={() => jumpToRegion("Pune (Swargate)", 18.5018, 73.8586, 13)}
          className={`px-2 py-0.5 rounded font-medium transition-all ${
            activeRegion === "Pune (Swargate)"
              ? "bg-[var(--primary)] text-white font-bold"
              : "hover:bg-[var(--surface-secondary)] text-[var(--foreground)]"
          }`}
        >
          📍 Pune (Swargate)
        </button>
        <button
          onClick={() => jumpToRegion("Mumbai", 19.0760, 72.8777, 12)}
          className={`px-2 py-0.5 rounded font-medium transition-all ${
            activeRegion === "Mumbai"
              ? "bg-[var(--primary)] text-white font-bold"
              : "hover:bg-[var(--surface-secondary)] text-[var(--foreground)]"
          }`}
        >
          Mumbai
        </button>
        <button
          onClick={() => jumpToRegion("Bengaluru", 12.9716, 77.5946, 12)}
          className={`px-2 py-0.5 rounded font-medium transition-all ${
            activeRegion === "Bengaluru"
              ? "bg-[var(--primary)] text-white font-bold"
              : "hover:bg-[var(--surface-secondary)] text-[var(--foreground)]"
          }`}
        >
          Bengaluru
        </button>
        <button
          onClick={() => jumpToRegion("Delhi NCR", 28.6139, 77.2090, 11)}
          className={`px-2 py-0.5 rounded font-medium transition-all ${
            activeRegion === "Delhi NCR"
              ? "bg-[var(--primary)] text-white font-bold"
              : "hover:bg-[var(--surface-secondary)] text-[var(--foreground)]"
          }`}
        >
          Delhi NCR
        </button>
        <div className="h-3 w-[1px] bg-[var(--border)] mx-1" />
        <button
          onClick={handleFitAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--foreground)] font-medium"
        >
          <Maximize2 className="h-3 w-3" /> Fit Route Bounds
        </button>
      </div>

      {/* Real OpenStreetMap Canvas */}
      <div
        ref={mapContainerRef}
        id="india-route-map"
        className="w-full h-[520px] bg-[#E5E7EB] z-0 rounded-xl overflow-hidden -mt-[48px]"
      />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-[var(--surface-elevated)]/90 backdrop-blur-md px-3 py-2 rounded-lg border border-[var(--border)] shadow-md text-[11px] flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#1E222A] border border-[#F59E0B]" />
          <span className="font-semibold text-[var(--foreground)]">Central Depot (India)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#2563EB]" />
          <span className="text-[var(--muted-foreground)]">Pending Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#10B981]" />
          <span className="text-[var(--muted-foreground)]">Delivered Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-1 bg-[#2563EB] rounded" />
          <span className="text-[var(--muted-foreground)]">OSRM Road Route</span>
        </div>
      </div>
    </div>
  );
}
