'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { MapPin, Navigation, LocateFixed } from 'lucide-react'

const pickerIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16 0 0 7.16 0 16C0 26 16 40 16 40C16 40 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="#3B82F6"/>
      <path d="M16 13C13.79 13 12 14.79 12 17C12 19.21 13.79 21 16 21C18.21 21 20 19.21 20 17C20 14.79 18.21 13 16 13Z" fill="white"/>
    </svg>
  `),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
})

interface AddressPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string, components?: any) => void
  initialLat?: number
  initialLng?: number
  className?: string
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Component to fly to location when position changes
function MapController({ position }: { position: [number, number] | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1 })
    }
  }, [position, map])
  
  return null
}

export default function AddressPicker({ onLocationSelect, initialLat, initialLng, className = '' }: AddressPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  )
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng])
    setLoading(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await response.json()
      const displayName = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setAddress(displayName)
      onLocationSelect(lat, lng, displayName)
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setLocating(true)
    setLoading(true)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      const { latitude, longitude } = position.coords
      setPosition([latitude, longitude])
      
      // Reverse geocode to get address
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        const data = await response.json()
        const displayName = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        setAddress(displayName)
        onLocationSelect(latitude, longitude, displayName)
      } catch (error) {
        console.error('Reverse geocoding failed:', error)
        setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        onLocationSelect(latitude, longitude, `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
      }
    } catch (error: any) {
      console.error('Geolocation error:', error)
      let message = 'Unable to get your location'
      if (error.code === 1) {
        message = 'Location access denied. Please enable location permissions and try again.'
      } else if (error.code === 2) {
        message = 'Location unavailable. Please check your GPS and try again.'
      } else if (error.code === 3) {
        message = 'Location request timed out. Please try again.'
      }
      alert(message)
    } finally {
      setLocating(false)
      setLoading(false)
    }
  }

  // Default center (can be dynamic based on user's last known location or a default city)
  const defaultCenter: [number, number] = [0, 0]

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border ${className}`}>
      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start gap-2">
        <div className="bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-border flex-1">
          <div className="flex items-center gap-2 text-sm text-secondary">
            <MapPin className="h-4 w-4 text-accent-gold" />
            <span className="truncate">{loading ? 'Finding address...' : address || 'Click on map to select location'}</span>
          </div>
        </div>
        
        {/* Use Current Location Button */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-border text-secondary hover:text-primary hover:border-accent-gold/50 transition-all disabled:opacity-50 flex items-center gap-2"
          title="Use my current location"
        >
          <LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} />
          {locating ? 'Locating...' : ''}
        </button>
      </div>
       <MapContainer
         center={position || defaultCenter}
         zoom={position ? 15 : 2}
         style={{ height: '100%', width: '100%', minHeight: '300px' }}
         scrollWheelZoom={true}
       >
         <MapController position={position} />
         <TileLayer
           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
         />
         <LocationMarker onLocationSelect={handleMapClick} />
         {position && (
           <Marker position={position} icon={pickerIcon}>
             <Popup>Selected location</Popup>
           </Marker>
         )}
       </MapContainer>
      {position && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          <button
            onClick={() => {
              setPosition(null)
              setAddress('')
              onLocationSelect(0, 0, '')
            }}
            className="bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-border text-sm text-secondary hover:text-primary transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
