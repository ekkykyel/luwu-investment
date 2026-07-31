import React, { useEffect, useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { supabase } from "../../lib/supabaseClient.js";
import { MapPin } from "lucide-react";

export default function DalakMap({ isDarkMode }: { isDarkMode: boolean }) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  useEffect(() => {
    async function fetchComplaints() {
      const { data } = await supabase
        .from("pengaduan")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      if (data) setComplaints(data);
    }
    fetchComplaints();
  }, []);

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-800 mb-4 relative">
      <Map
        initialViewState={{
          longitude: 120.2, // Luwu region rough center
          latitude: -3.0,
          zoom: 9
        }}
        transformRequest={(url) => {
          if (url.includes('cartocdn.com') || url.includes('openstreetmap.org') || url.includes('google') || url.includes('arcgisonline.com') || url.includes('demotiles.maplibre.org')) {
            return {
              url,
              headers: {}
            };
          }
          return { url };
        }}
        mapStyle={isDarkMode 
          ? "https://demotiles.maplibre.org/style.json" // Placeholder style, use a real one
          : "https://demotiles.maplibre.org/style.json"}
        mapLib={maplibregl}
        style={{ width: "100%", height: "100%" }}
      >
        {complaints.map((c) => (
          <Marker
            key={c.id}
            longitude={c.longitude}
            latitude={c.latitude}
            onClick={() => setSelectedComplaint(c)}
          >
            <MapPin className={`w-6 h-6 ${c.tipe_pelapor === 'investor' ? 'text-yellow-500' : 'text-red-500'}`} />
          </Marker>
        ))}

        {selectedComplaint && (
          <Popup
            longitude={selectedComplaint.longitude}
            latitude={selectedComplaint.latitude}
            onClose={() => setSelectedComplaint(null)}
            className="rounded-xl shadow-lg"
          >
            <div className="p-2 space-y-1 text-xs">
              <h4 className="font-bold">{selectedComplaint.nama_pelapor}</h4>
              <p>{selectedComplaint.deskripsi_masalah.substring(0, 50)}...</p>
              {selectedComplaint.bukti_foto_url && (
                <img src={selectedComplaint.bukti_foto_url} className="w-full h-20 object-cover mt-1 rounded" />
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
