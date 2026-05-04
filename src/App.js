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
  Search,
  Cpu,
  LogOut,
  ShieldCheck,
  Calendar,
  Target,
  TrendingDown,
  Timer,
  Users,
  Lightbulb,
} from "lucide-react";

// --- DATABASE CONFIG ---
const SUPABASE_URL = "https://glprsxjtsqzpjintupls.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_D03Pur4oIlyp2UJiNpdwYg_GYDWs_3o";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- WHOP CONFIG ---
const WHOP_CLIENT_ID = "app_S2qd4ooY1zM2nz";
const WHOP_API_KEY =
  "apik_Le7CeVbCgB9Y0_C4845077_C_cf0e1bec2c7b1096b6aa62503637fcdf2b184f591b157f52492a7173486a8a";
const COURSE_PRODUCT_ID = "prod_rIWXcTk3fsEbx";
const CHECKOUT_LINK = "https://whop.com/cart-to-cash/carttocash-pro";

const BLOCKED_STORES = ["daido", "harrison", "whole foods", "diado"];

export default function App() {
  const [view, setView] = useState("landing");
  const [activeTab, setActiveTab] = useState("radar");
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [stores, setStores] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [magicText, setMagicText] = useState("");
  const [showLegal, setShowLegal] = useState(false);

  // Feature 2 & 4: Performance State
  const [weeklyEarnings, setWeeklyEarnings] = useState(542.5);
  const [weeklyScore, setWeeklyScore] = useState(84);
  const [batchCount, setBatchCount] = useState(12);

  // Feature 1: Decision Engine State
  const [batchForm, setBatchForm] = useState({
    pay: "",
    items: "",
    miles: "",
    storeId: "",
  });

  const magicPhases = [
    "Authenticating Neural Link...",
    "Querying Satellite Nodes...",
    "Parsing Market Volatility...",
    "Optimizing Batch Clusters...",
  ];

  // --- 1. WHOP AUTH & SESSION LOCK ---
  const handleWhopLogin = () => {
    const origin = window.location.origin;
    const cleanUrl = origin.endsWith("/") ? origin : origin + "/";
    window.location.href = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      cleanUrl
    )}&response_type=code&scope=identify`;
  };

  const enforceSingleSession = async (email) => {
    const myId = Math.random().toString(36).substring(7);
    await supabase
      .from("profiles")
      .upsert({ email: email, last_session_id: myId }, { onConflict: "email" });
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("last_session_id")
        .eq("email", email)
        .single();
      if (data && data.last_session_id !== myId) {
        alert("Session conflict: Logged in on another device.");
        window.location.href = window.location.origin;
      }
    }, 20000);
  };

  // --- 2. BATCH DECISION ENGINE (FEATURE 1) ---
  const getDecision = () => {
    const { pay, items, miles } = batchForm;
    if (!pay || !items || !miles) return null;
    const hourlyTarget = 30.0;
    const estMins = parseInt(items) + 12 + parseFloat(miles) * 2.5; // Incl. driving
    const estHourly = (parseFloat(pay) / estMins) * 60;
    const diff = Math.abs(hourlyTarget - estHourly);

    if (estHourly >= hourlyTarget) {
      return {
        type: "ACCEPT",
        color: "#22c55e",
        text: `STRATEGIC MATCH. +$${diff.toFixed(2)}/hr above target.`,
      };
    } else {
      return {
        type: "SKIP",
        color: "#ef4444",
        text: `LOSS DETECTED: -$${diff.toFixed(
          2
        )}/hr. A better batch is coming.`,
      };
    }
  };

  // --- 3. NEURAL RADAR ENGINE (FEATURE 3) ---
  const calculateIntel = (store) => {
    const hr = new Date().getHours();
    const day = new Date().getDay();
    const isOpen =
      hr >= (store.open_hour || 8) && hr < (store.close_hour || 21);
    if (!isOpen) return { pct: 0, color: "#1e293b", label: "OFFLINE" };

    let score = store.brand_quality || 60;
    if (hr >= 7 && hr <= 10) score += 20; // Morning Drop
    if (hr >= 16 && hr <= 19) score += 15; // Evening Rush
    if (day === 0) score += 15; // Sunday

    const final = Math.min(Math.round(score), 99);
    const color = final > 85 ? "#22c55e" : final > 60 ? "#fbbf24" : "#f97316";
    return { pct: final, color, label: final > 85 ? "CRITICAL" : "ACTIVE" };
  };

  const startProScan = async () => {
    setIsMagicLoading(true);
    magicPhases.forEach((t, i) => setTimeout(() => setMagicText(t), i * 900));

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
                .map((s) => {
                  const intel = calculateIntel(s);
                  const R = 3958.8;
                  const dLat = ((s.latitude - lat) * Math.PI) / 180;
                  const dLon = ((s.longitude - lng) * Math.PI) / 180;
                  const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos((lat * Math.PI) / 180) *
                      Math.cos((s.latitude * Math.PI) / 180) *
                      Math.sin(dLon / 2) *
                      Math.sin(dLon / 2);
                  const dist = (
                    R *
                    2 *
                    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                  ).toFixed(1);
                  return { ...s, ...intel, dist };
                })
                .sort((a, b) => b.pct - a.pct)
            );
            setView("app");
            setIsMagicLoading(false);
          }
        }, 3500);
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
      enforceSingleSession("authorized_user@carttocash.pro");
    }
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#020408",
        minHeight: "100vh",
        color: "#f8fafc",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* --- MAGIC LOADER --- */}
      <AnimatePresence>
        {isMagicLoading && (
          <motion.div
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
            <Cpu size={60} color="#22c55e" className="animate-pulse" />
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
      {view !== "landing" && (
        <nav
          style={{
            padding: "15px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#020408",
            borderBottom: "1px solid #111827",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div
            onClick={() => setView("app")}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#0f172a",
              padding: "5px 12px",
              borderRadius: "20px",
              border: "1px solid #1e2937",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
            <span style={{ fontSize: "9px", fontWeight: "900" }}>
              NEURAL LINK ACTIVE
            </span>
          </div>
        </nav>
      )}

      {/* --- LANDING --- */}
      {view === "landing" && (
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
              SAVE $127+ IN GAS & TIME WEEKLY
            </div>
            <h1
              style={{
                fontSize: "52px",
                fontWeight: "1000",
                letterSpacing: "-3px",
                marginBottom: "20px",
                lineHeight: "0.9",
              }}
            >
              Master the <span style={{ color: "#22c55e" }}>Drop</span>.<br />
              Maximize the Cash.
            </h1>
            {isSubscriber ? (
              <button
                onClick={startProScan}
                style={{
                  background: "#22c55e",
                  color: "#000",
                  border: "none",
                  padding: "20px 50px",
                  borderRadius: "14px",
                  fontWeight: "1000",
                  fontSize: "18px",
                  cursor: "pointer",
                  boxShadow: "0 0 30px rgba(34,197,94,0.2)",
                }}
              >
                INITIALIZE RADAR
              </button>
            ) : (
              <div
                style={{
                  background: "#0f172a",
                  padding: "40px",
                  borderRadius: "32px",
                  border: "1px solid #1e2937",
                  maxWidth: "450px",
                  margin: "0 auto",
                }}
              >
                <ShieldAlert
                  size={48}
                  color="#22c55e"
                  style={{ margin: "0 auto 20px" }}
                />
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "900",
                    marginBottom: "10px",
                  }}
                >
                  Exclusive Access
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#94a3b8",
                    marginBottom: "30px",
                  }}
                >
                  Join Cart-to-Cash Pro to unlock the AI decision engine and
                  real-time market mapping.
                </p>
                <button
                  onClick={() => window.open(CHECKOUT_LINK)}
                  style={{
                    width: "100%",
                    background: "#22c55e",
                    color: "black",
                    padding: "18px",
                    borderRadius: "15px",
                    fontWeight: "1000",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  UNLOCK PRO ACCESS
                </button>
                <button
                  onClick={handleWhopLogin}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    marginTop: "20px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Already a student? Sign in
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* --- FEATURE 2: DASHBOARD --- */}
      {view === "app" && (
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "20px",
            paddingBottom: "140px",
          }}
        >
          {/* Weekly Progress Bar */}
          <div
            style={{
              background: "#0f172a",
              padding: "20px",
              borderRadius: "28px",
              border: "1px solid #1e2937",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "15px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: "900",
                    color: "#64748b",
                    letterSpacing: "1px",
                  }}
                >
                  WEEKLY SCORE: <b>{weeklyScore}/100</b>
                </p>
                <p
                  style={{
                    fontSize: "32px",
                    fontWeight: "1000",
                    color: "white",
                    margin: 0,
                  }}
                >
                  ${weeklyEarnings.toFixed(2)}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "1000",
                    color: "#22c55e",
                  }}
                >
                  PRO GRADE
                </p>
                <p
                  style={{
                    fontSize: "9px",
                    fontWeight: "800",
                    color: "#475569",
                  }}
                >
                  TARGET: $800
                </p>
              </div>
            </div>
            <div
              style={{
                height: "10px",
                background: "#020408",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(weeklyEarnings / 800) * 100}%` }}
                transition={{ duration: 1.5 }}
                style={{
                  height: "100%",
                  background: "#22c55e",
                  boxShadow: "0 0 15px #22c55e",
                }}
              />
            </div>
            <p
              style={{ marginTop: "15px", fontSize: "11px", color: "#94a3b8" }}
            >
              <TrendingUp size={12} style={{ display: "inline" }} /> At this
              pace, you will hit your goal by <b>Saturday Afternoon</b>.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              background: "#0f172a",
              padding: "5px",
              borderRadius: "18px",
              border: "1px solid #1e2937",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={() => setActiveTab("radar")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "14px",
                border: "none",
                background: activeTab === "radar" ? "#1e293b" : "transparent",
                color: activeTab === "radar" ? "#22c55e" : "#475569",
                fontWeight: "900",
                fontSize: "10px",
              }}
            >
              RADAR
            </button>
            <button
              onClick={() => setActiveTab("engine")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "14px",
                border: "none",
                background: activeTab === "engine" ? "#1e293b" : "transparent",
                color: activeTab === "engine" ? "#22c55e" : "#475569",
                fontWeight: "900",
                fontSize: "10px",
              }}
            >
              ENGINE
            </button>
            <button
              onClick={() => setActiveTab("planner")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "14px",
                border: "none",
                background: activeTab === "planner" ? "#1e293b" : "transparent",
                color: activeTab === "planner" ? "#22c55e" : "#475569",
                fontWeight: "900",
                fontSize: "10px",
              }}
            >
              PLANNER
            </button>
          </div>

          {/* --- RADAR (FEATURE 3) --- */}
          {activeTab === "radar" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {stores.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: "#0f172a",
                    padding: "24px",
                    borderRadius: "28px",
                    border:
                      s.pct > 85 ? "2px solid #22c55e" : "1px solid #1e2937",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
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
                        style={{
                          fontSize: "18px",
                          fontWeight: "800",
                          margin: 0,
                        }}
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
                        Peak demand starts in <b>15 minutes</b>.
                      </p>
                      <div
                        style={{
                          marginTop: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          color: "#22c55e",
                          fontSize: "11px",
                          fontWeight: "800",
                        }}
                      >
                        <Navigation2 size={12} fill="#22c55e" /> {s.dist} miles
                        away
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "38px",
                          fontWeight: "1000",
                          color: s.color,
                        }}
                      >
                        {s.pct}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- DECISION ENGINE (FEATURE 1) --- */}
          {activeTab === "engine" && (
            <div
              style={{
                background: "#0f172a",
                padding: "25px",
                borderRadius: "32px",
                border: "1px solid #1e2937",
              }}
            >
              <div
                style={{
                  background: "#020408",
                  padding: "25px",
                  borderRadius: "24px",
                  textAlign: "center",
                  border: "1px solid #1e2937",
                  marginBottom: "25px",
                }}
              >
                {getDecision() ? (
                  <div>
                    <div
                      style={{
                        fontSize: "42px",
                        fontWeight: "1000",
                        color: getDecision().color,
                      }}
                    >
                      {getDecision().type}
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#f8fafc",
                        marginTop: "10px",
                        fontWeight: "600",
                      }}
                    >
                      {getDecision().text}
                    </p>
                  </div>
                ) : (
                  <p
                    style={{
                      color: "#475569",
                      fontSize: "14px",
                      fontWeight: "700",
                    }}
                  >
                    Awaiting neural analysis...
                  </p>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <input
                  type="number"
                  value={batchForm.pay}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, pay: e.target.value })
                  }
                  placeholder="Batch Payout $"
                  style={{
                    background: "#030508",
                    border: "1px solid #1e2937",
                    padding: "15px",
                    borderRadius: "15px",
                    color: "white",
                  }}
                />
                <input
                  type="number"
                  value={batchForm.items}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, items: e.target.value })
                  }
                  placeholder="Item Count"
                  style={{
                    background: "#030508",
                    border: "1px solid #1e2937",
                    padding: "15px",
                    borderRadius: "15px",
                    color: "white",
                  }}
                />
                <input
                  type="number"
                  value={batchForm.miles}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, miles: e.target.value })
                  }
                  placeholder="Total Miles"
                  style={{
                    background: "#030508",
                    border: "1px solid #1e2937",
                    padding: "15px",
                    borderRadius: "15px",
                    color: "white",
                  }}
                />
                <button
                  onClick={() => {
                    setWeeklyEarnings(
                      (prev) => prev + parseFloat(batchForm.pay)
                    );
                    setActiveTab("radar");
                  }}
                  style={{
                    background: "#22c55e",
                    color: "black",
                    border: "none",
                    padding: "16px",
                    borderRadius: "16px",
                    fontWeight: "1000",
                    marginTop: "10px",
                    cursor: "pointer",
                  }}
                >
                  SYNC COMPLETED BATCH
                </button>
              </div>
            </div>
          )}

          {/* --- SHIFT PLANNER (FEATURE 5) --- */}
          {activeTab === "planner" && (
            <div
              style={{
                background: "#0f172a",
                padding: "25px",
                borderRadius: "32px",
                border: "1px solid #1e2937",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "900",
                  marginBottom: "15px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Calendar color="#22c55e" /> Strategy Block
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    background: "#020408",
                    padding: "15px",
                    borderRadius: "20px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "9px",
                      color: "#475569",
                      fontWeight: "900",
                    }}
                  >
                    START
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: "1000" }}>
                    7:45 AM
                  </p>
                </div>
                <div
                  style={{
                    background: "#020408",
                    padding: "15px",
                    borderRadius: "20px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "9px",
                      color: "#475569",
                      fontWeight: "900",
                    }}
                  >
                    END
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: "1000" }}>
                    11:30 AM
                  </p>
                </div>
              </div>
              <div
                style={{
                  background: "rgba(34, 197, 94, 0.1)",
                  padding: "15px",
                  borderRadius: "20px",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    color: "white",
                    fontWeight: "600",
                    margin: 0,
                  }}
                >
                  "Today your goal is <b>4 batches</b> at a <b>$28 average</b>.
                  Position near the <b>DeCicco & Sons</b> plaza for the 8:00 AM
                  drop. Skip any pharmacy orders under $15."
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- COMMUNITY WINS FEED (FEATURE 7) --- */}
      {view === "app" && (
        <div
          style={{
            position: "fixed",
            bottom: "60px",
            left: 0,
            right: 0,
            height: "40px",
            background: "#111827",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            borderTop: "1px solid #1e2937",
          }}
        >
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            style={{
              display: "flex",
              gap: "50px",
              whiteSpace: "nowrap",
              padding: "0 20px",
            }}
          >
            {["Carlos J.", "Maria R.", "Sarah K.", "David W."].map(
              (name, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "11px",
                    fontWeight: "900",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#22c55e",
                    }}
                  />
                  <span style={{ color: "#94a3b8" }}>{name}</span>
                  <span style={{ color: "#22c55e" }}>
                    +${(Math.random() * 40 + 20).toFixed(2)}
                  </span>
                  <span style={{ color: "#475569" }}>[BATCH COMPLETED]</span>
                </div>
              )
            )}
          </motion.div>
        </div>
      )}

      {/* --- FOOTER & LEGAL --- */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(2, 4, 8, 0.98)",
          padding: "15px",
          textAlign: "center",
          borderTop: "1px solid #111827",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          zIndex: 100,
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
            cursor: "pointer",
          }}
        >
          TERMS & LEGAL
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
              maxWidth: "400px",
              border: "1px solid #1e2937",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "900",
                color: "#22c55e",
                marginBottom: "10px",
              }}
            >
              Legal
            </h2>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>
              BatchSignal AI is an independent tool not affiliated with
              Instacart. Data is predictive and not guaranteed income. Use while
              parked only.
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
    </div>
  );
}
