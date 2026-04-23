'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Package, Navigation, MapPin } from 'lucide-react'

// Custom icons
const pickupIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16 0 0 7.16 0 16C0 26 16 40 16 40C16 40 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="#10B981"/>
      <path d="M16 13C13.79 13 12 14.79 12 17C12 19.21 13.79 21 16 21C18.21 21 20 19.21 20 17C20 14.79 18.21 13 16 13Z" fill="white"/>
    </svg>
  `),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
})

const dropoffIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16 0 0 7.16 0 16C0 26 16 40 16 40C16 40 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="#EF4444"/>
      <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  `),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
})

const driverIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C8.954 0 0 8.954 0 20C0 35 20 50 20 50C20 50 40 35 40 20C40 8.954 31.046 0 20 0Z" fill="#3B82F6"/>
      <path d="M12 25C12 20 13 16 16 14C17 13.5 18.5 13.5 19.5 14C20 14 20.5 14.2 20.7 14.5C19.5 12 16 11 12 14C11 15 10.5 16.5 10.5 18C10.5 21 12 24 12 25Z" fill="white"/>
      <path d="M28 25C28 20 27 16 24 14C22.5 13.5 21 14 20.5 14C20 14 19.5 14.2 19.3 14.5C20.5 12 24 11 28 14C29 15 29.5 16.5 29.5 18C29.5 21 28 24 28 25Z" fill="white"/>
    </svg>
  `),
  iconSize: [40, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -50],
})

interface Location {
  latitude: number | null
  longitude: number | null
}

interface DriverCoords {
  latitude: number | null
  longitude: number | null
  lastLocationUpdate?: string | null
}

interface LiveMapProps {
  pickupLocation: Location
  dropoffLocation: Location
  driverLocation?: DriverCoords | null
  driverName?: string
  className?: string
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  map.setView(center, zoom)
  return null
}

export function LiveMap({ pickupLocation, dropoffLocation, driverLocation, driverName, className = '' }: LiveMapProps) {
  // Guard: if coordinates missing, show placeholder
  if (!pickupLocation.latitude || !pickupLocation.longitude || !dropoffLocation.latitude || !dropoffLocation.longitude) {
    return (
      <div className={`flex items-center justify-center bg-secondary/5 ${className}`}>
        <p className="text-secondary">Map unavailable: missing coordinates</p>
      </div>
    )
  }

  const [route, setRoute] = useState<[number, number][]>([])

  // Non-null coordinates (guarded above)
  const pLat = pickupLocation.latitude
  const pLng = pickupLocation.longitude
  const dLat = dropoffLocation.latitude
  const dLng = dropoffLocation.longitude

  // Calculate center point and zoom
  const center: [number, number] = [
    (pLat + dLat) / 2,
    (pLng + dLng) / 2,
  ]

  // Draw route line
  useEffect(() => {
    setRoute([
      [pLat, pLng],
      [dLat, dLng],
    ])
  }, [pLat, pLng, dLat, dLng])

  // Calculate route distance
  const distance = route.length > 1 ? calculateDistance(
    pLat, pLng,
    dLat, dLng
  ) : 0

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)} m`
    return `${km.toFixed(1)} km`
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border ${className}`}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <MapController center={center} zoom={13} />

        {/* Pickup marker */}
        <Marker position={[pLat, pLng]} icon={pickupIcon}>
          <Popup>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-success" />
              <span className="font-medium">Pickup</span>
            </div>
          </Popup>
        </Marker>

        {/* Dropoff marker */}
        <Marker position={[dLat, dLng]} icon={dropoffIcon}>
          <Popup>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-error" />
              <span className="font-medium">Dropoff</span>
            </div>
          </Popup>
        </Marker>

        {/* Driver location */}
        {driverLocation && driverLocation.latitude != null && driverLocation.longitude != null && (
          <Marker
            position={[driverLocation.latitude, driverLocation.longitude]}
            icon={driverIcon}
          >
            <Popup>
              <div>
                <p className="font-semibold">{driverName || 'Driver'}</p>
                <p className="text-xs text-secondary">
                  {driverLocation.lastLocationUpdate
                    ? `Updated ${new Date(driverLocation.lastLocationUpdate).toLocaleTimeString()}`
                    : ''}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route line */}
        {route.length > 1 && (
          <Polyline
            positions={route}
            color="#D4AF37"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>

      {/* Distance badge */}
      {distance > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-accent-gold" />
            <span className="font-semibold text-primary">{formatDistance(distance)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
