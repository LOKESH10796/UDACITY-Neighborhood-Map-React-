import { useState, useEffect } from 'react'
import { MapPin, Map as MapIcon, Loader2, AlertCircle, X, Sparkles, Navigation } from 'lucide-react'
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

// Highlight icon for selected venue (custom HTML marker for glowing effect)
const createGlowingIcon = () => L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-8 h-8 rounded-full bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.8)] border-4 border-white flex items-center justify-center animate-bounce">
           <div class="w-2 h-2 bg-white rounded-full"></div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

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

const Typewriter = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
      }
    }, 20)
    return () => clearInterval(interval)
  }, [text])
  return <span>{displayed}</span>
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: \`You are a snarky, fun, and highly creative food critic. Write a short, funny, engaging 2-sentence review about the restaurant "\${venue.name}" located at "\${venue.location.address}" in \${venue.location.city}.\`
            }]
          }]
        }
      )
      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No review generated.'
      setAiDescription(text.replace(/\\*/g, '')) // Remove markdown bolding from API response
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
    <div className="min-h-screen bg-slate-900 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={\`fixed inset-y-0 left-0 w-80 bg-white/10 backdrop-blur-3xl border-r border-white/20 transform transition-transform duration-500 z-[1000] lg:relative flex flex-col shadow-2xl \${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}\`}>
        <div className="p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="flex items-center gap-3 relative z-10">
            <MapIcon className="w-8 h-8 text-white drop-shadow-md" />
            <h2 className="text-2xl font-black text-white tracking-wider drop-shadow-md">Nexus Map</h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-full text-white hover:bg-white/30 transition relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10 bg-black/20">
          <input 
            type="text" 
            placeholder="Search hotspots..." 
            className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner text-white placeholder-slate-300 backdrop-blur-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-4" />
              <span className="text-slate-300 font-medium">Scanning area...</span>
            </div>
          ) : filteredVenues.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No venues found matching your criteria.</p>
          ) : (
            filteredVenues.map(venue => (
              <button
                key={venue.id}
                onClick={() => handleVenueClick(venue.id)}
                className={\`w-full text-left p-4 rounded-xl transition-all duration-300 border \${
                  selectedVenueId === venue.id
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] transform scale-[1.02]'
                    : 'bg-white/5 border-white/10 hover:border-purple-400/50 hover:bg-white/10'
                }\`}
              >
                <p className={\`font-bold text-lg tracking-wide \${selectedVenueId === venue.id ? 'text-purple-300' : 'text-slate-100'}\`}>{venue.name}</p>
                {venue.location.address && (
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                    <Navigation className="w-3 h-3" /> {venue.location.address}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Map View */}
      <main className="flex-1 relative lg:ml-0 h-screen w-full bg-slate-900">
        <div className="lg:hidden absolute top-4 left-4 z-[1000]">
          <button onClick={() => setSidebarOpen(true)} className="p-3 bg-slate-900/80 backdrop-blur-md text-white rounded-xl shadow-2xl hover:bg-slate-800 transition border border-white/20">
            <MapIcon className="w-6 h-6" />
          </button>
        </div>

        <MapContainer center={[18.5204, 73.8567]} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false} className="z-0 brightness-75 contrast-125 saturate-50">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
          <MapController selectedVenue={selectedVenue} />
          {filteredVenues.map(venue => (
            <Marker 
              key={venue.id} 
              position={[venue.location.lat, venue.location.lng]}
              icon={selectedVenueId === venue.id ? createGlowingIcon() : L.Icon.Default.prototype as any}
              eventHandlers={{ click: () => handleVenueClick(venue.id) }}
            />
          ))}
        </MapContainer>

        {/* AI Info Card (Advanced Glassmorphism) */}
        {selectedVenue && (
          <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-8 lg:bottom-8 lg:w-[420px] z-[1000] bg-slate-900/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/20 p-7 transition-all animate-in slide-in-from-bottom-12 fade-in duration-500">
            <div className="absolute -top-3 -right-3 w-20 h-20 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse"></div>
            <div className="absolute -bottom-3 -left-3 w-20 h-20 bg-pink-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse delay-75"></div>
            
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 drop-shadow-sm">
                  {selectedVenue.name}
                </h3>
                <p className="text-sm text-slate-300 font-medium flex items-center gap-1.5 mt-1.5">
                  <MapPin className="w-4 h-4 text-purple-400" /> {selectedVenue.location.address}
                </p>
              </div>
              <button onClick={handleCloseInfo} className="p-2 bg-white/5 hover:bg-white/20 rounded-full transition-colors border border-white/10 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-5 pt-5 border-t border-white/10 relative z-10">
              <div className="flex items-center gap-2 mb-3 text-pink-400 font-bold text-xs uppercase tracking-widest">
                <Sparkles className="w-4 h-4" /> Gemini Flash 2.5
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-3 text-slate-300 text-sm animate-pulse bg-white/5 p-4 rounded-xl border border-white/10">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" /> Synthesizing culinary opinion...
                </div>
              ) : (
                <div className="bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                  <p className="text-slate-200 text-sm leading-relaxed italic font-medium">
                    "<Typewriter text={aiDescription || ''} />"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App