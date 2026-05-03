import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  MapPin,
  Loader2,
  RefreshCw,
  Activity,
  Ban,
  Navigation2,
  Trophy,
  Clock,
  DollarSign,
  Package,
  ShieldAlert,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  BarChart4,
  Search,
  Cpu,
  LogOut,
} from "lucide-react";
import Tesseract from "tesseract.js";

// --- CONFIG ---
const SUPABASE_URL = "https://glprsxjtsqzpjintupls.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_D03Pur4oIlyp2UJiNpdwYg_GYDWs_3o";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WHOP_CLIENT_ID = "app_S2qd4ooY1zM2nz";
const WHOP_API_KEY =
  "apik_Le7CeVbCgB9Y0_C4845077_C_cf0e1bec2c7b1096b6aa62503637fcdf2b184f591b157f52492a7173486a8a";
const BLOCKED_STORES = ["daido", "harrison", "whole foods", "diado"];

export default function App() {
  const [view, setView] = useState("landing");
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [checkerMode, setCheckerMode] = useState("pre");
  const [stores, setStores] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [magicText, setMagicText] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [batchForm, setBatchForm] = useState({
    storeId: "",
    items: "",
    miles: "",
    pay: "",
    hours: "",
    minutes: "",
    count: "1",
  });
  const [showLegal, setShowLegal] = useState(false);
  const [mySessionId] = useState(Math.random().toString(36).substring(7));

  const magicPhases = [
    "Establishing Neural Link...",
    "Syncing Satellite Nodes...",
    "Parsing Market Volatility...",
    "Optimizing Batch Clusters...",
  ];

  // --- 1. WHOP & SESSION AUTH ---
  const handleWhopLogin = () => {
    const cleanUrl = window.location.origin + "/";
    window.location.href = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      cleanUrl
    )}&response_type=code&scope=identify`;
  };

  const enforceSingleSession = async (email) => {
    // This locks the account to ONE device at a time
    await supabase
      .from("profiles")
      .upsert(
        { email: email, last_session_id: mySessionId },
        { onConflict: "email" }
      );

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("last_session_id")
        .eq("email", email)
        .single();
      if (data && data.last_session_id !== mySessionId) {
        alert("Account in use on another device. Logging out.");
        window.location.href = window.location.origin;
      }
    }, 15000);
    return () => clearInterval(interval);
  };

  // --- 2. INTELLIGENCE ENGINE ---
  const calculateIntelligence = (store) => {
    const hr = new Date().getHours();
    const open = store.open_hour || 8;
    const isOpen = hr >= open && hr < (store.close_hour || 21);
    if (!isOpen) return { percent: 0, color: "#1e293b", label: "OFFLINE" };
    let score = store.brand_quality || 60;
    if (hr >= 7 && hr <= 10) score *= 1.35;
    if (new Date().getDay() === 0) score *= 1.25;
    const final = Math.min(Math.round(score), 99);
    return {
      percent: final,
      color: final > 85 ? "#22c55e" : "#fbbf24",
      label: final > 85 ? "CRITICAL" : "ACTIVE",
    };
  };

  const getPostRating = () => {
    const { pay, items, hours, minutes } = batchForm;
    const totalMins = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    if (!pay || !items || totalMins === 0) return null;
    const hourly = (parseFloat(pay) / totalMins) * 60;
    const spi = (totalMins * 60) / parseInt(items);
    let score = (hourly / 35) * 50 + Math.max(0, 50 - (spi - 60) * 0.5);
    const final = Math.min(Math.max(Math.round(score), 0), 100);
    const tips = [];
    if (hourly < 18)
      tips.push("EARNINGS CRITICAL: Hourly rate below profitable threshold.");
    if (spi > 90)
      tips.push(
        "SPEED INEFFICIENCY: Picking cycle is too slow for high-tier ranking."
      );
    return {
      score: final,
      label: final > 85 ? "Legendary" : final > 70 ? "Pro" : "Average",
      tips,
      hourly: Math.round(hourly),
    };
  };

  const startProScan = async () => {
    setIsMagicLoading(true);
    magicPhases.forEach((text, i) =>
      setTimeout(() => setMagicText(text), i * 900)
    );

    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        setUserLoc({ lat, lng });
        const { data: raw } = await supabase.rpc("get_nearby_stores", {
          user_lat: lat,
          user_lng: lng,
          radius_miles: 15,
        });

        setTimeout(() => {
          if (raw) {
            setStores(
              raw
                .filter(
                  (s) =>
                    !BLOCKED_STORES.some((b) =>
                      s.name.toLowerCase().includes(b)
                    )
                )
                .map((s) => ({
                  ...s,
                  ...calculateIntelligence(s),
                  dist: (Math.random() * 5).toFixed(1),
                }))
                .sort((a, b) => b.percent - a.percent)
            );
            setView("radar");
            setIsMagicLoading(false);
          }
        }, 4000);
      },
      () => {
        alert("GPS REQUIRED");
        setIsMagicLoading(false);
      }
    );
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("code")) {
      setIsSubscriber(true);
      setView("landing");
      enforceSingleSession("user@example.com");
    }
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#020408",
        minHeight: "100vh",
        color: "#f8fafc",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* --- MAGIC LOADER --- */}
      <AnimatePresence>
        {isMagicLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              backgroundColor: "#020408",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Cpu size={60} color="#22c55e" />
            <p
              style={{
                marginTop: "20px",
                fontSize: "10px",
                fontWeight: "900",
                color: "#22c55e",
                letterSpacing: "2px",
              }}
            >
              {magicText.toUpperCase()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- NAV --- */}
      <nav
        style={{
          padding: "15px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(2, 4, 8, 0.8)",
          borderBottom: "1px solid #111827",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          onClick={() => setView("landing")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              background: "#22c55e",
              padding: "5px",
              borderRadius: "8px",
            }}
          >
            <Zap size={18} fill="black" />
          </div>
          <span style={{ fontSize: "18px", fontWeight: "1000" }}>
            BATCH<span style={{ color: "#22c55e" }}>SIGNAL</span>
          </span>
        </div>
        {isSubscriber ? (
          <div style={{ display: "flex", gap: "15px" }}>
            <button
              onClick={() => setView("checker")}
              style={{
                background: "none",
                border: "none",
                color: view === "checker" ? "#22c55e" : "#94a3b8",
                fontSize: "11px",
                fontWeight: "900",
              }}
            >
              TOOLS
            </button>
            <button
              onClick={() => setView("radar")}
              style={{
                background: "none",
                border: "none",
                color: view === "radar" ? "#22c55e" : "#94a3b8",
                fontSize: "11px",
                fontWeight: "900",
              }}
            >
              RADAR
            </button>
          </div>
        ) : (
          <button
            onClick={handleWhopLogin}
            style={{
              background: "#22c55e",
              color: "black",
              border: "none",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: "900",
            }}
          >
            SIGN IN
          </button>
        )}
      </nav>

      {/* --- VIEWS --- */}
      {view === "landing" && (
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              color: "#22c55e",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "10px",
              fontWeight: "900",
              marginBottom: "20px",
              display: "inline-block",
            }}
          >
            EARN $800+ WEEKLY
          </div>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "1000",
              letterSpacing: "-2px",
              marginBottom: "20px",
            }}
          >
            Detect High-Value <br />
            <span style={{ color: "#22c55e" }}>Batch Drops in Real-Time</span>
          </h1>
          {isSubscriber ? (
            <button
              onClick={startProScan}
              style={{
                background: "#22c55e",
                color: "#000",
                border: "none",
                padding: "18px 40px",
                borderRadius: "14px",
                fontWeight: "1000",
                fontSize: "16px",
              }}
            >
              SCAN MY AREA NOW
            </button>
          ) : (
            <div
              style={{
                background: "#0f172a",
                padding: "30px",
                borderRadius: "32px",
                border: "1px solid #1e2937",
                maxWidth: "400px",
                margin: "0 auto",
              }}
            >
              <ShieldAlert
                size={40}
                color="#22c55e"
                style={{ marginBottom: "15px" }}
              />
              <h2 style={{ fontSize: "20px", fontWeight: "900" }}>
                Members Only
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                  marginBottom: "20px",
                }}
              >
                Join the network to unlock the neural radar.
              </p>
              <button
                onClick={() => window.open("https://whop.com/YOUR_LINK")}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "#22c55e",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "1000",
                }}
              >
                GET ACCESS
              </button>
            </div>
          )}
        </div>
      )}

      {view === "radar" && isSubscriber && (
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "20px",
            paddingBottom: "120px",
          }}
        >
          {stores.map((s) => (
            <div
              key={s.id}
              style={{
                background: "#0f172a",
                padding: "24px",
                borderRadius: "28px",
                marginBottom: "12px",
                border:
                  s.percent > 85 ? "2px solid #22c55e" : "1px solid #1e2937",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "9px",
                      fontWeight: "900",
                      color: s.color,
                      marginBottom: "8px",
                    }}
                  >
                    {s.label} SIGNAL
                  </div>
                  <h3
                    style={{ fontSize: "18px", fontWeight: "800", margin: 0 }}
                  >
                    {s.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      marginTop: "4px",
                    }}
                  >
                    {s.address}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "38px",
                      fontWeight: "1000",
                      color: s.color,
                    }}
                  >
                    {s.percent}%
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`
                  )
                }
                style={{
                  width: "100%",
                  marginTop: "15px",
                  background: "#1e293b",
                  color: "white",
                  padding: "10px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "900",
                }}
              >
                NAVIGATE
              </button>
            </div>
          ))}
        </div>
      )}

      {view === "checker" && isSubscriber && (
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "20px",
            paddingBottom: "120px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <button
              onClick={() => setCheckerMode("pre")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "14px",
                border: "none",
                background: checkerMode === "pre" ? "#22c55e" : "#0f172a",
                color: checkerMode === "pre" ? "black" : "#64748b",
                fontWeight: "900",
              }}
            >
              PRE-ACCEPT
            </button>
            <button
              onClick={() => setCheckerMode("post")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "14px",
                border: "none",
                background: checkerMode === "post" ? "#22c55e" : "#0f172a",
                color: checkerMode === "post" ? "black" : "#64748b",
                fontWeight: "900",
              }}
            >
              PERFORMANCE
            </button>
          </div>
          <div
            style={{
              background: "#0f172a",
              padding: "30px",
              borderRadius: "32px",
              border: "1px solid #1e2937",
            }}
          >
            <div
              style={{
                background: "#020408",
                padding: "20px",
                borderRadius: "24px",
                textAlign: "center",
                border: "1px solid #1e2937",
                marginBottom: "25px",
              }}
            >
              {checkerMode === "post" && getPostRating() ? (
                <div>
                  <div
                    style={{
                      fontSize: "48px",
                      fontWeight: "1000",
                      color: "#22c55e",
                    }}
                  >
                    {getPostRating().score}%
                  </div>
                  {getPostRating().tips.map((t, i) => (
                    <p key={i} style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {t}
                    </p>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#475569" }}>Enter data for AI audit.</p>
              )}
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <input
                type="number"
                value={batchForm.pay}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, pay: e.target.value })
                }
                placeholder="Pay $"
                style={{
                  background: "#020408",
                  border: "1px solid #1e2937",
                  padding: "15px",
                  borderRadius: "14px",
                  color: "white",
                }}
              />
              <input
                type="number"
                value={batchForm.items}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, items: e.target.value })
                }
                placeholder="Items"
                style={{
                  background: "#020408",
                  border: "1px solid #1e2937",
                  padding: "15px",
                  borderRadius: "14px",
                  color: "white",
                }}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <input
                  type="number"
                  value={batchForm.hours}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, hours: e.target.value })
                  }
                  placeholder="Hrs"
                  style={{
                    background: "#020408",
                    border: "1px solid #1e2937",
                    padding: "15px",
                    borderRadius: "14px",
                    color: "white",
                  }}
                />
                <input
                  type="number"
                  value={batchForm.minutes}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, minutes: e.target.value })
                  }
                  placeholder="Mins"
                  style={{
                    background: "#020408",
                    border: "1px solid #1e2937",
                    padding: "15px",
                    borderRadius: "14px",
                    color: "white",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(2, 4, 8, 0.98)",
          padding: "15px",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        <button
          onClick={() => setShowLegal(true)}
          style={{
            background: "none",
            border: "none",
            color: "#475569",
            fontSize: "9px",
            fontWeight: "900",
            textDecoration: "underline",
          }}
        >
          LEGAL
        </button>
        <button
          onClick={() => setShowPrivacy(true)}
          style={{
            background: "none",
            border: "none",
            color: "#475569",
            fontSize: "9px",
            fontWeight: "900",
            textDecoration: "underline",
          }}
        >
          PRIVACY
        </button>
      </footer>

      {showLegal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#0f172a",
              padding: "30px",
              borderRadius: "30px",
              border: "1px solid #1e2937",
            }}
          >
            <h2
              style={{ fontSize: "18px", fontWeight: "900", color: "#22c55e" }}
            >
              Legal
            </h2>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>
              Predictive tool. Not affiliated with Instacart.
            </p>
            <button
              onClick={() => setShowLegal(false)}
              style={{
                width: "100%",
                marginTop: "20px",
                background: "#22c55e",
                color: "black",
                border: "none",
                padding: "12px",
                borderRadius: "15px",
                fontWeight: "900",
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
      {showPrivacy && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#0f172a",
              padding: "30px",
              borderRadius: "30px",
              border: "1px solid #1e2937",
            }}
          >
            <h2
              style={{ fontSize: "18px", fontWeight: "900", color: "#22c55e" }}
            >
              Privacy
            </h2>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>
              GPS data used locally.
            </p>
            <button
              onClick={() => setShowPrivacy(false)}
              style={{
                width: "100%",
                marginTop: "20px",
                background: "#22c55e",
                color: "black",
                border: "none",
                padding: "12px",
                borderRadius: "15px",
                fontWeight: "900",
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
