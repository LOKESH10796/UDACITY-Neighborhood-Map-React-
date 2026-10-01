import { useState, useEffect, useRef } from 'react'
import { MapPin, Map as MapIcon, Loader2, X, Sparkles, Navigation, Star, Utensils, Info } from 'lucide-react'
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

const createCustomIcon = (active: boolean) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${active ? 'bg-sky-500 scale-110 shadow-[0_0_20px_rgba(14,165,233,0.6)] z-50' : 'bg-slate-800 scale-100 shadow-md'} border-[3px] border-white">
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

  useEffect(() => {
    const loadVenues = async () => {
      setLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        const mockData: Venue[] = [
          { id: '1', name: 'Café GoodLuck', rating: 4.6, cuisine: 'Irani Cafe', location: { lat: 18.5172, lng: 73.8414, address: 'Fergusson College Rd', city: 'Pune' } },
          { id: '2', name: 'Incognito', rating: 4.4, cuisine: 'Continental', location: { lat: 18.5617, lng: 73.9168, address: 'Phoenix Market City', city: 'Pune' } },
          { id: '3', name: 'Hard Rock Cafe', rating: 4.5, cuisine: 'American', location: { lat: 18.5390, lng: 73.9128, address: 'Koregaon Park', city: 'Pune' } },
          { id: '4', name: 'Barbeque Nation', rating: 4.7, cuisine: 'North Indian', location: { lat: 18.5165, lng: 73.8423, address: 'Deccan Gymkhana', city: 'Pune' } },
          { id: '5', name: 'Cafe Goa', rating: 4.2, cuisine: 'Goan', location: { lat: 18.5618, lng: 73.9071, address: 'Viman Nagar', city: 'Pune' } },
          { id: '6', name: 'Blue Nile', rating: 4.8, cuisine: 'Mughlai', location: { lat: 18.5219, lng: 73.8775, address: 'Camp', city: 'Pune' } },
          { id: '7', name: 'Way Down South', rating: 4.3, cuisine: 'South Indian', location: { lat: 18.5664, lng: 73.7708, address: 'Baner', city: 'Pune' } },
          { id: '8', name: 'Suonmoi Chinese', rating: 4.5, cuisine: 'Chinese', location: { lat: 18.5375, lng: 73.8797, address: 'Koregaon Park', city: 'Pune' } },
          { id: '9', name: 'The Bounty Sizzlers', rating: 4.6, cuisine: 'Sizzlers', location: { lat: 18.5488, lng: 73.9054, address: 'Kalyani Nagar', city: 'Pune' } },
          { id: '10', name: 'Little Italy', rating: 4.4, cuisine: 'Italian', location: { lat: 18.5350, lng: 73.8382, address: 'Shivajinagar', city: 'Pune' } }
        ]
        setVenues(mockData)
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
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

  const filteredVenues = venues.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const selectedVenue = venues.find(v => v.id === selectedVenueId) || null

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Left Sidebar (List View) */}
      <aside className={`absolute lg:relative flex-none w-full sm:w-96 h-full bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 rounded-lg">
              <MapIcon className="w-6 h-6 text-sky-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Neighborhood Map</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search restaurants..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-sm transition-shadow text-slate-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
              <p className="text-slate-500 font-medium">Finding the best spots...</p>
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Info className="w-12 h-12 mb-2 opacity-50" />
              <p>No venues match your search.</p>
            </div>
          ) : (
            filteredVenues.map(venue => (
              <div
                key={venue.id}
                onClick={() => handleVenueClick(venue.id)}
                className={`group cursor-pointer p-4 rounded-xl transition-all duration-200 border ${
                  selectedVenueId === venue.id
                    ? 'bg-sky-50 border-sky-300 shadow-md'
                    : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold ${selectedVenueId === venue.id ? 'text-sky-700' : 'text-slate-800'}`}>
                    {venue.name}
                  </h3>
                  <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-bold">
                    {venue.rating} <Star className="w-3 h-3 fill-current" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-2">
                  <Utensils className="w-3.5 h-3.5" /> {venue.cuisine}
                </p>
                <p className="text-sm text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {venue.location.address}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Map Area */}
      <main className="flex-1 relative bg-slate-200">
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="absolute top-4 left-4 z-[400] lg:hidden p-3 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <MapIcon className="w-6 h-6" />
        </button>

        <MapContainer center={[18.5204, 73.8567]} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false} className="z-0">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
          <MapController selectedVenue={selectedVenue} />
          {filteredVenues.map(venue => (
            <Marker 
              key={venue.id} 
              position={[venue.location.lat, venue.location.lng]}
              icon={createCustomIcon(selectedVenueId === venue.id)}
              eventHandlers={{ click: () => handleVenueClick(venue.id) }}
            />
          ))}
        </MapContainer>
      </main>

      {/* Right Drawer (Venue Details + AI) */}
      <aside 
        className={`absolute right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          selectedVenue ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedVenue && (
          <div className="flex flex-col h-full h-[100dvh]">
            {/* Header Image Area */}
            <div className="relative h-64 bg-slate-800 overflow-hidden shrink-0">
              <img 
                src={`https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80`} 
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
              
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Navigation className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-800 font-medium">Location</p>
                  <p className="text-slate-500 text-sm mt-0.5">{selectedVenue.location.address}, {selectedVenue.location.city}</p>
                </div>
              </div>

              {/* AI Section */}
              <div className="relative group rounded-2xl p-1 bg-gradient-to-br from-sky-400 via-indigo-400 to-purple-400 overflow-hidden shadow-sm transition-all hover:shadow-md">
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative bg-white rounded-xl p-5 h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800">Gemini AI Review</h3>
                  </div>
                  
                  <div className="min-h-[80px]">
                    {aiLoading ? (
                      <div className="flex flex-col items-center justify-center py-4 space-y-3">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                        <p className="text-sm text-slate-400 font-medium animate-pulse">Generating snarky review...</p>
                      </div>
                    ) : (
                      <p className="text-slate-700 leading-relaxed italic text-[15px]">
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
