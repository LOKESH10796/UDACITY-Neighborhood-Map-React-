import { useState, useEffect } from 'react'
import { MapPin, Map, Loader2, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Venue {
  id: string
  name: string
  location: {
    lat: number
    lng: number
    address?: string
    city?: string
    state?: string
    postalCode?: string
  }
}

interface MarkerData {
  id: string
  lat: number
  lng: number
  isOpen: boolean
  isVisible: boolean
  animate: boolean
}

const searchVenueParams = [
  { near: 'Pune, Maharashtra, India', query: 'Café GoodLuck', ll: '18.517247, 73.841487', limit: 1 },
  { near: 'Pune, Maharashtra, India', query: 'Incognito', ll: '18.561770, 73.916895', limit: 1 },
  { near: 'Pune, Maharashtra, India', query: 'Hard Rock Cafe', ll: '18.5390, 73.9128', limit: 1 },
  { near: 'Pune, Maharashtra, India', query: 'Barbeque Nation Pune', ll: '18.5165, 73.8423', limit: 1 },
  { near: 'Pune, Maharashtra, India', query: 'Cafe Goa', ll: '18.5618, 73.9071', limit: 1 },
  { near: 'Pune, Maharashtra, India', query: 'Blue Nile', ll: '18.5219, 73.8775', limit: 1 },
  { near: 'Pune, Maharashtra, India', query: 'Way Down South', ll: '18.5664, 73.7708', limit: 1 },
  { near: 'Pune, Maharashtra, India', query: 'Suonmoi Chinese Restaurant', ll: '18.5375, 73.8797', limit: 1 },
  { near: 'Pune, Maharashtra, India', query: 'The Bounty Sizzlers', ll: '18.5488, 73.9054', limit: 1 },
  { near: 'Pune, Maharashtra, India', query: 'Little Italy', ll: '18.5350, 73.8382', limit: 1 }
]

const FOURSQUARE_API = 'https://api.foursquare.com/v2/venues/search'
const CLIENT_ID = 'YOUR_CLIENT_ID'
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET'

function App() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const loadVenues = async () => {
      setLoading(true)
      setError(null)
      try {
        const results = await Promise.all(
          searchVenueParams.map(async (params) => {
            const url = new URL(FOURSQUARE_API)
            url.searchParams.set('client_id', CLIENT_ID)
            url.searchParams.set('client_secret', CLIENT_SECRET)
            url.searchParams.set('v', '20240101')
            url.searchParams.set('near', params.near)
            url.searchParams.set('query', params.query)
            url.searchParams.set('ll', params.ll)
            url.searchParams.set('limit', params.limit.toString())

            const res = await fetch(url.toString())
            if (!res.ok) throw new Error(`Failed to load ${params.query}`)
            const data = await res.json()
            
            const venue = data.response.venues?.[0]
            if (!venue) return null

            return {
              id: venue.id,
              name: venue.name,
              location: {
                lat: venue.location.lat,
                lng: venue.location.lng,
                address: venue.location.address ?? '',
                city: venue.location.city ?? '',
                state: venue.location.state ?? '',
                postalCode: venue.location.postalCode ?? ''
              }
            } as Venue | null
          })
        )

        const validVenues = results.filter((v): v is Venue => v !== null)
        setVenues(validVenues)

        const newMarkers = validVenues.map(v => ({
          id: v.id,
          lat: v.location.lat,
          lng: v.location.lng,
          isOpen: false,
          isVisible: true,
          animate: false
        }))
        setMarkers(newMarkers)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load venues')
      } finally {
        setLoading(false)
      }
    }

    loadVenues()
  }, [])

  const handleMarkerClick = (marker: MarkerData) => {
    setMarkers(prev => prev.map(m => ({
      ...m,
      isOpen: m.id === marker.id && !m.isOpen,
      animate: m.id === marker.id
    })))
    setSelectedVenueId(marker.id)
  }

  const handleVenueClick = (venueId: string) => {
    setMarkers(prev => prev.map(m => ({
      ...m,
      isOpen: m.id === venueId,
      animate: m.id === venueId
    })))
    setSelectedVenueId(venueId)
  }

  const handleCloseInfo = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMarkers(prev => prev.map(m => ({ ...m, isOpen: false })))
    setSelectedVenueId(null)
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 z-40 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">Neighborhood Map</h2>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded hover:bg-slate-100"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                <span className="ml-2 text-slate-500">Loading venues...</span>
              </div>
            ) : venues.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No venues found</p>
            ) : (
              venues.map(venue => (
                <button
                  key={venue.id}
                  onClick={() => handleVenueClick(venue.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedVenueId === venue.id
                      ? 'bg-sky-100 text-sky-700 font-medium shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-medium">{venue.name}</p>
                  {venue.location.address && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{venue.location.address}</p>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Restaurant information provided by Foursquare&reg;
            </p>
          </div>
        </div>
      </aside>

      {/* Map */}
      <main className="flex-1 relative lg:ml-0">
        <div className="lg:hidden p-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-30">
          <h2 className="text-lg font-bold text-slate-900">Pune Restaurant Map</h2>
          <button onClick={toggleSidebar} className="p-2 rounded hover:bg-slate-100" aria-label="Open sidebar">
            <Map className="w-6 h-6" />
          </button>
        </div>

        <div id="map" className="w-full h-screen" style={{ width: '100%', height: '100vh' }} />

        {selectedVenueId && (
          <div className="fixed bottom-4 right-4 lg:bottom-8 lg:right-8 bg-white rounded-xl shadow-lg border border-slate-200 p-4 max-w-sm z-50 animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {venues.find(v => v.id === selectedVenueId)?.name}
                </p>
                {venues.find(v => v.id === selectedVenueId)?.location.address && (
                  <p className="text-sm text-slate-500 mt-1">
                    {venues.find(v => v.id === selectedVenueId)?.location.address}
                  </p>
                )}
              </div>
              <button onClick={handleCloseInfo} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App