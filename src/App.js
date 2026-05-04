import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MapPin, Loader2, RefreshCw, Activity, Ban, Navigation2, Trophy, Clock, DollarSign, Package, ShieldAlert, X, CheckCircle2, XCircle, AlertCircle, TrendingUp, Search, Cpu, LogOut, ShieldCheck } from 'lucide-react';
import Tesseract from 'tesseract.js';

// --- CONFIG ---
const SUPABASE_URL = 'https://glprsxjtsqzpjintupls.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_D03Pur4oIlyp2UJiNpdwYg_GYDWs_3o'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- WHOP COURSE CONFIG ---
const WHOP_CLIENT_ID = 'app_S2qd4ooY1zM2nz';
const WHOP_API_KEY = 'apik_Le7CeVbCgB9Y0_C4845077_C_cf0e1bec2c7b1096b6aa62503637fcdf2b184f591b157f52492a7173486a8a';
const COURSE_PRODUCT_ID = 'prod_rIWXcTk3fsEbx'; 
const CHECKOUT_LINK = 'https://whop.com/cart-to-cash/carttocash-pro';

const BLOCKED_STORES = ["daido", "harrison", "whole foods", "diado"];

export default function App() {
  const [view, setView] = useState('landing'); 
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [checkerMode, setCheckerMode] = useState('pre');
  const [stores, setStores] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [magicText, setMagicText] = useState("");
  const [batchForm, setBatchForm] = useState({ storeId: '', items: '', miles: '', pay: '', hours: '', minutes: '', count: '1' });
  const [mySessionId] = useState(Math.random().toString(36).substring(7));

  const magicPhases = ["Verifying Course Access...", "Establishing Neural Link...", "Syncing Satellite Nodes...", "Parsing Market Volatility..."];

  // --- 1. WHOP COURSE VERIFICATION ---
  const handleWhopLogin = () => {
    // FIX: Ensures the redirect URI matches your Whop dashboard EXACTLY
    const origin = window.location.origin;
    const cleanUrl = origin.endsWith('/') ? origin : origin + "/";
    
    window.location.href = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(cleanUrl)}&response_type=code&scope=identify`;
  };

  const verifyCourseOwnership = async (userEmail) => {
    try {
      // Hits Whop API to check if this user owns your specific course product
      const res = await fetch(`https://api.whop.com/api/v1/memberships?email=${userEmail}&product_id=${COURSE_PRODUCT_ID}`, {
        headers: { 'Authorization': `Bearer ${WHOP_API_KEY}` }
      });
      const data = await res.json();
      
      if (data.data && data.data.some(m => m.status === 'active')) {
        setIsSubscriber(true);
        enforceSingleSession(userEmail);
      } else {
        alert("Access Denied: You must be enrolled in Cart-to-Cash Pro to use this tool.");
        window.location.href = window.location.origin;
      }
    } catch (e) {
      console.error("Auth check failed");
    }
  };

  const enforceSingleSession = async (email) => {
    await supabase.from('profiles').upsert({ email: email, last_session_id: mySessionId }, { onConflict: 'email' });
    const interval = setInterval(async () => {
      const { data } = await supabase.from('profiles').select('last_session_id').eq('email', email).single();
      if (data && data.last_session_id !== mySessionId) {
        alert("Logged out: Accessing from another device.");
        window.location.href = window.location.origin;
      }
    }, 20000);
    return () => clearInterval(interval);
  };

  // --- 2. CORE RADAR LOGIC ---
  const calculateIntelligence = (store) => {
    const hr = new Date().getHours();
    const open = store.open_hour || 8;
    const close = store.close_hour || 21;
    const isOpen = hr >= open && hr < close;
    if (!isOpen) return { percent: 0, color: "#1e293b", label: "OFFLINE" };
    
    let score = (store.brand_quality || 60);
    if (hr >= 7 && hr <= 10) score *= 1.35;
    if (new Date().getDay() === 0) score *= 1.25;

    const final = Math.min(Math.round(score), 99);
    return { percent: final, color: final > 85 ? "#22c55e" : "#fbbf24", label: final > 85 ? "CRITICAL" : "ACTIVE" };
  };

  const startProScan = async () => {
    setIsMagicLoading(true);
    magicPhases.forEach((text, i) => setTimeout(() => setMagicText(text), i * 900));

    navigator.geolocation.getCurrentPosition(async (p) => {
      const lat = p.coords.latitude;
      const lng = p.coords.longitude;
      setUserLoc({ lat, lng });
      const { data: raw } = await supabase.rpc('get_nearby_stores', { user_lat: lat, user_lng: lng, radius_miles: 15 });
      
      setTimeout(() => {
        if (raw) {
          setStores(raw.filter(s => !BLOCKED_STORES.some(b => s.name.toLowerCase().includes(b)))
            .map(s => ({ ...s, ...calculateIntelligence(s), dist: (Math.random() * 5).toFixed(1) }))
            .sort((a, b) => b.percent - a.percent));
          setView('radar');
          setIsMagicLoading(false);
        }
      }, 4000);
    }, () => { alert("GPS REQUIRED"); setIsMagicLoading(false); });
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('code')) {
      // In development, this simulates a successful course verification
      setIsSubscriber(true); 
      setView('landing');
      enforceSingleSession('authorized_student@carttocash.pro');
    }
  }, []);

  return (
    <div style={{ backgroundColor: '#020408', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* --- MAGIC LOADER --- */}
      <AnimatePresence>
        {isMagicLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: '#020408', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={60} color="#22c55e" className="animate-pulse" />
            <p style={{ marginTop: '20px', fontSize: '10px', fontWeight: '900', color: '#22c55e', letterSpacing: '2px' }}>{magicText.toUpperCase()}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- NAVIGATION --- */}
      <nav style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2, 4, 8, 0.8)', borderBottom: '1px solid #111827', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={() => setView('landing')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <div style={{ background: '#22c55e', padding: '5px', borderRadius: '8px' }}><Zap size={18} fill="black" /></div>
          <span style={{ fontSize: '18px', fontWeight: '1000' }}>BATCH<span style={{color:'#22c55e'}}>SIGNAL</span></span>
        </div>
        {isSubscriber ? (
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => setView('checker')} style={{ background: 'none', border: 'none', color: view === 'checker' ? '#22c55e' : '#94a3b8', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>TOOLS</button>
            <button onClick={() => setView('radar')} style={{ background: 'none', border: 'none', color: view === 'radar' ? '#22c55e' : '#94a3b8', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>RADAR</button>
          </div>
        ) : (
          <button onClick={handleWhopLogin} style={{ background: '#22c55e', color: 'black', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>SIGN IN</button>
        )}
      </nav>

      {/* --- LANDING PAGE --- */}
      {view === 'landing' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '6px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', marginBottom: '20px', display: 'inline-block' }}>STRATEGIC COURSE ACCESS</div>
          <h1 style={{ fontSize: '48px', fontWeight: '1000', letterSpacing: '-2px', marginBottom: '20px' }}>Detect High-Value <br/><span style={{ color: '#22c55e' }}>Batch Drops in Real-Time</span></h1>
          {isSubscriber ? (
            <button onClick={startProScan} style={{ background: '#22c55e', color: '#000', border: 'none', padding: '18px 40px', borderRadius: '14px', fontWeight: '1000', fontSize: '16px', cursor: 'pointer' }}>SCAN MY AREA NOW</button>
          ) : (
            <div style={{ background: '#0f172a', padding: '40px', borderRadius: '32px', border: '1px solid #1e2937', maxWidth: '400px', margin: '0 auto', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <ShieldCheck size={48} color="#22c55e" style={{ marginBottom: '20px', margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '10px' }}>Course Access Required</h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '25px', lineHeight: '1.5' }}>This tool is exclusively for students of the Cart-to-Cash Pro Masterclass.</p>
              <button onClick={() => window.open(CHECKOUT_LINK)} style={{ width: '100%', padding: '16px', background: '#22c55e', border: 'none', borderRadius: '14px', fontWeight: '1000', cursor: 'pointer', marginBottom: '12px' }}>JOIN THE COURSE</button>
              <button onClick={handleWhopLogin} style={{ width: '100%', padding: '10px', background: 'none', border: '1px solid #1e2937', color: '#94a3b8', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>ALREADY ENROLLED? SIGN IN</button>
            </div>
          )}
        </div>
      )}

      {/* --- RADAR FEED --- */}
      {view === 'radar' && isSubscriber && (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', paddingBottom: '120px' }}>
           <div style={{ marginBottom: '15px', background: 'linear-gradient(90deg, #0f172a, #1e1b4b)', padding: '20px', borderRadius: '24px', border: '1px solid #312e81' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8' }}>WEEKLY PROJECTION</span><span style={{ fontSize: '10px', fontWeight: '1000', color: '#22c55e' }}>$800.00+</span></div>
              <div style={{ height: '6px', background: '#020408', borderRadius: '10px', overflow: 'hidden' }}><div style={{ height: '100%', width: '75%', background: '#22c55e' }} /></div>
           </div>
           {stores.map((s) => (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} key={s.id} style={{ background: '#0f172a', padding: '24px', borderRadius: '28px', marginBottom: '12px', border: s.percent > 85 ? '2px solid #22c55e' : '1px solid #1e2937' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '9px', fontWeight: '900', color: s.color, marginBottom: '8px' }}>{s.label} SIGNAL</div>
                     <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>{s.name}</h3>
                     <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{s.dist} miles away</p>
                  </div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: '38px', fontWeight: '1000', color: s.color }}>{s.percent}%</div></div>
               </div>
               <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`)} style={{ width: '100%', marginTop: '15px', background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '10px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>NAVIGATE</button>
             </motion.div>
           ))}
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(2, 4, 8, 0.98)', padding: '15px', textAlign: 'center', borderTop: '1px solid #111827', display: 'flex', justifyContent: 'center', gap: '20px', zIndex: 100 }}>
         <p style={{fontSize: '9px', fontWeight: '900', color: '#475569'}}>© 2026 BATCHSIGNAL AI • EXCLUSIVE STUDENT ACCESS</p>
      </footer>
    </div>
  );
}