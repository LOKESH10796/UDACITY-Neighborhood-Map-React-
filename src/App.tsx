import { useState, useEffect, useRef } from 'react'
import { MapPin, Map as MapIcon, Loader2, X, Sparkles, Navigation, Star, Utensils, Info, Moon, Sun } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'

// Leaflet Icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const createCustomIcon = (active: boolean, isDark: boolean) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${active ? 'bg-sky-500 scale-110 shadow-[0_0_20px_rgba(14,165,233,0.6)] z-50' : (isDark ? 'bg-slate-800' : 'bg-slate-700') + ' scale-100 shadow-md'} border-[3px] border-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
})

interface Venue {
  id: string
  name: string
  rating: number
  cuisine: string
  location: {
    lat: number
    lng: number
    address: string
    city: string
  }
}

function MapController({ selectedVenue }: { selectedVenue: Venue | null }) {
  const map = useMap()
  useEffect(() => {
    if (selectedVenue) {
      map.flyTo([selectedVenue.location.lat, selectedVenue.location.lng], 16, { animate: true, duration: 1.2 })
    }
  }, [selectedVenue, map])
  return null
}

const Typewriter = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    setDisplayed('')
    setIsTyping(true)
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        setIsTyping(false)
        clearInterval(interval)
      }
    }, 15)
    return () => clearInterval(interval)
  }, [text])

  return (
    <span className="relative">
      {displayed}
      {isTyping && <span className="inline-block w-1.5 h-4 ml-1 bg-sky-500 animate-pulse align-middle"></span>}
    </span>
  )
}

function App() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDescription, setAiDescription] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true)
      try {
        const query = searchQuery.trim() || 'restaurant'
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
          params: {
            q: `${query} in Pune`,
            format: 'json',
            limit: 12
          }
        })
        
        const mappedVenues = response.data
          .filter((item: any) => item.name) // ensure it has a name
          .map((item: any) => ({
            id: item.place_id.toString(),
            name: item.name,
            rating: (Math.random() * (5.0 - 3.8) + 3.8).toFixed(1),
            cuisine: item.type === 'restaurant' ? 'Dining' : (item.type.charAt(0).toUpperCase() + item.type.slice(1)),
            location: {
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              address: item.display_name.split(',')[1]?.trim() || item.display_name.split(',')[0],
              city: 'Pune'
            }
          }))
        
        // Remove duplicates by name
        const unique = mappedVenues.filter((v: Venue, i: number, a: Venue[]) => a.findIndex(t => (t.name === v.name)) === i)
        setVenues(unique)
      } catch (err) {
        console.error("Failed to fetch venues", err)
      } finally {
        setLoading(false)
      }
    }
    
    const timeoutId = setTimeout(() => {
      fetchPlaces()
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const fetchAiReview = async (venue: Venue) => {
    setAiLoading(true)
    setAiDescription(null)
    try {
      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim()
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{
              text: `You are a snarky, fun, and highly creative food critic. Write a short, funny, engaging 2-sentence review about the restaurant "${venue.name}" located at "${venue.location.address}" in ${venue.location.city}. Do not use markdown.`
            }]
          }]
        }
      )
      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No review generated.'
      setAiDescription(text.replace(/\*/g, ''))
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || err.message
      setAiDescription(`Our AI critic is currently out to lunch. Error: ${errMsg}`)
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

  const selectedVenue = venues.find(v => v.id === selectedVenueId) || null

  return (
    <div className={`min-h-screen flex overflow-hidden font-sans ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-80 ${isDark ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'} backdrop-blur-3xl border-r transform transition-transform duration-500 z-[1000] lg:relative flex flex-col shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-between shadow-lg relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="flex items-center gap-3 relative z-10">
            <MapIcon className="w-8 h-8 text-white drop-shadow-md" />
            <h2 className="text-2xl font-black text-white tracking-wider drop-shadow-md">Nexus Map</h2>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full text-white hover:bg-white/30 transition">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-full text-white hover:bg-white/30 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className={`p-4 border-b ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-100 bg-slate-50'}`}>
          <input 
            type="text" 
            placeholder="Search hotspots..." 
            className={`w-full px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner transition-all ${
              isDark ? 'bg-white/10 border-white/20 text-white placeholder-slate-300' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-4" />
              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Scanning area...</span>
            </div>
          ) : venues.length === 0 ? (
            <p className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No venues found matching your criteria.</p>
          ) : (
            venues.map(venue => (
              <button
                key={venue.id}
                onClick={() => handleVenueClick(venue.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 border ${
                  selectedVenueId === venue.id
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] transform scale-[1.02]'
                    : (isDark ? 'bg-white/5 border-white/10 hover:border-purple-400/50 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-purple-400 hover:shadow-sm')
                }`}
              >
                <p className={`font-bold text-lg tracking-wide ${selectedVenueId === venue.id ? 'text-purple-500 dark:text-purple-300' : (isDark ? 'text-slate-100' : 'text-slate-800')}`}>{venue.name}</p>
                {venue.location.address && (
                  <p className={`text-sm mt-1 flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
        <div className="absolute top-4 left-4 z-[1000] flex gap-2">
          <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-3 backdrop-blur-md rounded-xl shadow-2xl transition border ${isDark ? 'bg-slate-900/80 text-white border-white/20 hover:bg-slate-800' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'}`}>
            <MapIcon className="w-6 h-6" />
          </button>
        </div>

        <MapContainer center={[18.5204, 73.8567]} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false} className={`absolute inset-0 z-0 ${isDark ? 'dark-map-tiles' : ''}`}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapController selectedVenue={selectedVenue} />
          {venues.map(venue => (
            <Marker 
              key={venue.id} 
              position={[venue.location.lat, venue.location.lng]}
              icon={createCustomIcon(selectedVenueId === venue.id, isDark)}
              eventHandlers={{ click: () => handleVenueClick(venue.id) }}
            />
          ))}
        </MapContainer>
      </main>

      {/* Right Drawer (Venue Details + AI) */}
      <aside 
        className={`absolute right-0 top-0 h-full w-full sm:w-[400px] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          selectedVenue ? 'translate-x-0' : 'translate-x-full'
        } ${isDark ? 'bg-slate-900' : 'bg-white'}`}
      >
        {selectedVenue && (
          <div className="flex flex-col h-full h-[100dvh]">
            {/* Header Image Area */}
            <div className="relative h-64 bg-slate-800 overflow-hidden shrink-0">
              <img 
                src={`https://picsum.photos/seed/${selectedVenue.id}/800/400`} 
                alt="Restaurant atmosphere" 
                className="w-full h-full object-cover opacity-60"
              />
              <button 
                onClick={() => setSelectedVenueId(null)} 
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1 drop-shadow-md">{selectedVenue.name}</h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-white text-sm font-medium">
                      <Utensils className="w-3.5 h-3.5" /> {selectedVenue.cuisine}
                    </span>
                  </div>
                  <div className="flex flex-col items-center bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg">
                    <span className="text-lg leading-none">{selectedVenue.rating}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-90">Rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                <Navigation className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
                <div>
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Location</p>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedVenue.location.address}, {selectedVenue.location.city}</p>
                </div>
              </div>

              {/* AI Section */}
              <div className="relative group rounded-2xl p-1 bg-gradient-to-br from-sky-400 via-indigo-400 to-purple-400 overflow-hidden shadow-sm transition-all hover:shadow-md">
                <div className={`absolute inset-0 ${isDark ? 'bg-black' : 'bg-white'} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className={`relative rounded-xl p-5 h-full ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Gemini AI Review</h3>
                  </div>
                  
                  <div className="min-h-[80px]">
                    {aiLoading ? (
                      <div className="flex flex-col items-center justify-center py-4 space-y-3">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                        <p className="text-sm text-slate-400 font-medium animate-pulse">Generating snarky review...</p>
                      </div>
                    ) : (
                      <p className={`leading-relaxed italic text-[15px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        "{aiDescription && <Typewriter text={aiDescription} />}"
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </aside>

    </div>
  )
}

export default App
