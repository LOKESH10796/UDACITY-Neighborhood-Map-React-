import { useState, useEffect } from 'react'
import { MapPin, Map as MapIcon, Loader2, AlertCircle, X, Sparkles } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'

// Fix default leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Highlight icon for selected venue
const highlightIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Venue {
  id: string
  name: string
  location: {
    lat: number
    lng: number
    address?: string
    city?: string
  }
}

// Component to dynamically fly map to selected marker
function MapController({ selectedVenue }: { selectedVenue: Venue | null }) {
  const map = useMap()
  useEffect(() => {
    if (selectedVenue) {
      map.flyTo([selectedVenue.location.lat, selectedVenue.location.lng], 16, { animate: true, duration: 1.5 })
    }
  }, [selectedVenue, map])
  return null
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

function App() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDescription, setAiDescription] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadVenues = async () => {
      setLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        const mockData = [
          { id: '1', name: 'Café GoodLuck', location: { lat: 18.5172, lng: 73.8414, address: 'Fergusson College Rd', city: 'Pune' } },
          { id: '2', name: 'Incognito', location: { lat: 18.5617, lng: 73.9168, address: 'Phoenix Market City', city: 'Pune' } },
          { id: '3', name: 'Hard Rock Cafe', location: { lat: 18.5390, lng: 73.9128, address: 'Koregaon Park', city: 'Pune' } },
          { id: '4', name: 'Barbeque Nation', location: { lat: 18.5165, lng: 73.8423, address: 'Deccan Gymkhana', city: 'Pune' } },
          { id: '5', name: 'Cafe Goa', location: { lat: 18.5618, lng: 73.9071, address: 'Viman Nagar', city: 'Pune' } },
          { id: '6', name: 'Blue Nile', location: { lat: 18.5219, lng: 73.8775, address: 'Camp', city: 'Pune' } },
          { id: '7', name: 'Way Down South', location: { lat: 18.5664, lng: 73.7708, address: 'Baner', city: 'Pune' } },
          { id: '8', name: 'Suonmoi Chinese', location: { lat: 18.5375, lng: 73.8797, address: 'Koregaon Park', city: 'Pune' } },
          { id: '9', name: 'The Bounty Sizzlers', location: { lat: 18.5488, lng: 73.9054, address: 'Kalyani Nagar', city: 'Pune' } },
          { id: '10', name: 'Little Italy', location: { lat: 18.5350, lng: 73.8382, address: 'Shivajinagar', city: 'Pune' } }
        ]
        setVenues(mockData)
      } catch (err) {
        setError('Failed to load venues')
      } finally {
        setLoading(false)
      }
    }
    loadVenues()
  }, [])

  const fetchAiReview = async (venue: Venue) => {
    setAiLoading(true)
    setAiDescription(null)
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3-8b-instruct:free',
          messages: [
            { role: 'system', content: 'You are a snarky, fun, and highly creative food critic.' },
            { role: 'user', content: `Write a short, funny, engaging 2-sentence review about the restaurant "${venue.name}" located at "${venue.location.address}" in ${venue.location.city}.` }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'Neighborhood Explorer'
          }
        }
      )
      setAiDescription(response.data.choices[0].message.content)
    } catch (err) {
      setAiDescription('Our AI critic is currently out to lunch (or rate limited). Try again later!')
    } finally {
      setAiLoading(false)
    }
  }

  const handleVenueClick = (venueId: string) => {
    setSelectedVenueId(venueId)
    const venue = venues.find(v => v.id === venueId)
    if (venue) fetchAiReview(venue)
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  const handleCloseInfo = () => {
    setSelectedVenueId(null)
    setAiDescription(null)
  }

  const filteredVenues = venues.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const selectedVenue = venues.find(v => v.id === selectedVenueId) || null

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200 transform transition-transform duration-300 z-[1000] lg:relative lg:translate-x-0 flex flex-col shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 bg-gradient-to-r from-sky-600 to-indigo-600 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <MapIcon className="w-7 h-7 text-white" />
            <h2 className="text-xl font-black text-white tracking-wide">Explorer AI</h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-full text-white hover:bg-white/20 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-white/50">
          <input 
            type="text" 
            placeholder="Search restaurants..." 
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-4" />
              <span className="text-slate-500 font-medium">Discovering spots...</span>
            </div>
          ) : filteredVenues.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No venues found matching your search.</p>
          ) : (
            filteredVenues.map(venue => (
              <button
                key={venue.id}
                onClick={() => handleVenueClick(venue.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 border ${
                  selectedVenueId === venue.id
                    ? 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-300 shadow-md transform scale-[1.02]'
                    : 'bg-white border-slate-100 hover:border-sky-200 hover:shadow-sm'
                }`}
              >
                <p className={`font-bold text-lg ${selectedVenueId === venue.id ? 'text-sky-700' : 'text-slate-800'}`}>{venue.name}</p>
                {venue.location.address && (
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {venue.location.address}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Map View */}
      <main className="flex-1 relative lg:ml-0 h-screen w-full">
        <div className="lg:hidden absolute top-4 left-4 z-[1000]">
          <button onClick={() => setSidebarOpen(true)} className="p-3 bg-white text-slate-800 rounded-xl shadow-xl hover:bg-slate-50 transition border border-slate-200">
            <MapIcon className="w-6 h-6" />
          </button>
        </div>

        <MapContainer center={[18.5204, 73.8567]} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
          <MapController selectedVenue={selectedVenue} />
          {filteredVenues.map(venue => (
            <Marker 
              key={venue.id} 
              position={[venue.location.lat, venue.location.lng]}
              icon={selectedVenueId === venue.id ? highlightIcon : L.Icon.Default.prototype as any}
              eventHandlers={{ click: () => handleVenueClick(venue.id) }}
            />
          ))}
        </MapContainer>

        {/* AI Info Card (Glassmorphism) */}
        {selectedVenue && (
          <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:bottom-6 lg:w-96 z-[1000] bg-white/70 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 p-6 transition-all animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-black text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600">
                  {selectedVenue.name}
                </h3>
                <p className="text-sm text-slate-600 font-medium flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" /> {selectedVenue.location.address}
                </p>
              </div>
              <button onClick={handleCloseInfo} className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200/50">
              <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> AI Critic Says:
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-3 text-slate-500 text-sm animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cooking up a spicy review...
                </div>
              ) : (
                <p className="text-slate-700 text-sm leading-relaxed italic">
                  "{aiDescription}"
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App