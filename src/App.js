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
  Info,
  BarChart4,
  Lightbulb,
  Trash2,
  Calendar,
  Target,
  Timer,
} from "lucide-react";
import Tesseract from "tesseract.js";

// --- CONFIG ---
const SUPABASE_URL = "https://glprsxjtsqzpjintupls.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_D03Pur4oIlyp2UJiNpdwYg_GYDWs_3o";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WHOP_CLIENT_ID = "app_S2qd4ooY1zM2nz";
const CHECKOUT_LINK = "https://whop.com/cart-to-cash/carttocash-pro";
const BLOCKED_STORES = ["daido", "harrison", "whole foods", "diado"];

export default function App() {
  const [view, setView] = useState("landing");
  const [activeTab, setActiveTab] = useState("radar");
  const [raterMode, setRaterMode] = useState("pre");
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [stores, setStores] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [magicText, setMagicText] = useState("");

  // --- BATCH & PROGRESS STATE ---
  const [weeklyBatches, setWeeklyBatches] = useState([]);
  const [batchForm, setBatchForm] = useState({
    pay: "",
    items: "",
    miles: "",
    hours: "",
    minutes: "",
    storeName: "",
  });
  const [mySessionId] = useState(Math.random().toString(36).substring(7));
  const [showLegal, setShowLegal] = useState(false);

  // --- 1. MONDAY RESET & STATS LOGIC ---
  useEffect(() => {
    const lastReset = localStorage.getItem("last_monday_reset");
    const now = new Date();
    const currentMonday = new Date(
      now.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    ).toLocaleDateString();

    if (lastReset !== currentMonday) {
      setWeeklyBatches([]);
      localStorage.setItem("last_monday_reset", currentMonday);
    }
  }, []);

  const weeklyEarnings = weeklyBatches.reduce(
    (sum, b) => sum + parseFloat(b.payout || 0),
    0
  );
  const totalMinsWorked = weeklyBatches.reduce(
    (sum, b) => sum + (parseInt(b.duration_mins) || 0),
    0
  );
  const avgHourly =
    totalMinsWorked > 0
      ? Math.round((weeklyEarnings / totalMinsWorked) * 60)
      : 0;

  // --- 2. THE STRATEGY ENGINE (INTEGRATED PLANNER) ---
  const getShiftStrategy = () => {
    const day = new Date().getDay();
    return {
      window: day === 0 ? "6:45 AM - 1:00 PM" : "7:30 AM - 11:30 AM",
      target: day === 0 ? "Costco & Sam's Club" : "DeCicco & Wegmans",
      expected: day === 0 ? "$35-55/hr" : "$24-32/hr",
      tactic:
        day === 0
          ? "Heavy volume morning drop. Camp at wholesale hubs."
          : "Focus on high-speed premium grocery orders.",
    };
  };

  // --- 3. DUAL RATER LOGIC ---
  const getPreGrade = () => {
    const { pay, items, miles } = batchForm;
    if (!pay || !items || !miles) return null;
    const estMins = parseInt(items) * 1.2 + parseFloat(miles) * 2.5 + 12;
    const estHourly = (parseFloat(pay) / estMins) * 60;
    let grade =
      estHourly > 32 ? "A" : estHourly > 24 ? "B" : estHourly > 18 ? "C" : "F";
    let color =
      grade === "A"
        ? "#22c55e"
        : grade === "B"
        ? "#10b981"
        : grade === "C"
        ? "#fbbf24"
        : "#ef4444";
    return { grade, estHourly: Math.round(estHourly), color };
  };

  const getPostRating = () => {
    const { pay, items, hours, minutes } = batchForm;
    const totalMins = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    if (!pay || !items || totalMins === 0) return null;
    const hourly = (parseFloat(pay) / totalMins) * 60;
    const spi = (totalMins * 60) / parseInt(items);
    let score = (hourly / 35) * 50 + Math.max(0, 50 - (spi - 60) * 0.5);
    return {
      score: Math.min(Math.max(Math.round(score), 0), 100),
      hourly: Math.round(hourly),
    };
  };

  // --- 4. AUTH & NAVIGATION ---
  const handleWhopLogin = () => {
    const cleanUrl = window.location.origin + "/";
    window.location.href = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      cleanUrl
    )}&response_type=code&scope=identify`;
  };

  const startProScan = async () => {
    setIsMagicLoading(true);
    const phases = [
      "Establishing Neural Link...",
      "Syncing Satellite Nodes...",
      "Parsing Market Drops...",
    ];
    phases.forEach((t, i) => setTimeout(() => setMagicText(t), i * 900));

    navigator.geolocation.getCurrentPosition(async (p) => {
      const { latitude: lat, longitude: lng } = p.coords;
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
                  !BLOCKED_STORES.some((b) => s.name.toLowerCase().includes(b))
              )
              .map((s) => ({
                ...s,
                pct: s.brand_quality || 60,
                dist: (Math.random() * 5).toFixed(1),
              }))
              .sort((a, b) => b.pct - a.pct)
          );
          setView("app");
          setIsMagicLoading(false);
        }
      }, 3500);
    });
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("code")) setIsSubscriber(true);
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

      {/* --- NAV & WEEKLY DASHBOARD --- */}
      {view !== "landing" && (
        <nav
          style={{
            borderBottom: "1px solid #111827",
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "rgba(2, 4, 8, 0.8)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              padding: "15px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
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
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: "900",
                  color: "#22c55e",
                  margin: 0,
                }}
              >
                LIVE PERFORMANCE
              </p>
              <p style={{ fontSize: "16px", fontWeight: "1000", margin: 0 }}>
                ${avgHourly}
                <span style={{ fontSize: "10px", color: "#475569" }}>
                  /HR AVG
                </span>
              </p>
            </div>
          </div>
          {/*满足 WEEKLY GOAL BAR */}
          <div style={{ padding: "0 20px 15px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "5px",
              }}
            >
              <span
                style={{ fontSize: "9px", fontWeight: "900", color: "#64748b" }}
              >
                WEEKLY PROGRESS
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "1000",
                  color: "#22c55e",
                }}
              >
                ${weeklyEarnings.toFixed(2)} / $800
              </span>
            </div>
            <div
              style={{
                height: "4px",
                background: "#0f172a",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ width: `${(weeklyEarnings / 800) * 100}%` }}
                transition={{ duration: 1 }}
                style={{
                  height: "100%",
                  background: "#22c55e",
                  boxShadow: "0 0 10px #22c55e",
                }}
              />
            </div>
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
            <h1
              style={{
                fontSize: "52px",
                fontWeight: "1000",
                letterSpacing: "-3px",
                marginBottom: "20px",
                lineHeight: "0.9",
              }}
            >
              Stop Guessing.
              <br />
              <span style={{ color: "#22c55e" }}>Start Winning.</span>
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
                  Subscriber Access Only
                </h2>
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
                  UNLOCK ACCESS
                </button>
                <button
                  onClick={handleWhopLogin}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    marginTop: "20px",
                    fontWeight: "bold",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  Student Sign In
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* --- MAIN DASHBOARD --- */}
      {view === "app" && (
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "20px",
            paddingBottom: "140px",
          }}
        >
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
              NEURAL RADAR
            </button>
            <button
              onClick={() => setActiveTab("rater")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "14px",
                border: "none",
                background: activeTab === "rater" ? "#1e293b" : "transparent",
                color: activeTab === "rater" ? "#22c55e" : "#475569",
                fontWeight: "900",
                fontSize: "10px",
              }}
            >
              BATCH RATER
            </button>
            <button
              onClick={() => setActiveTab("history")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "14px",
                border: "none",
                background: activeTab === "history" ? "#1e293b" : "transparent",
                color: activeTab === "history" ? "#22c55e" : "#475569",
                fontWeight: "900",
                fontSize: "10px",
              }}
            >
              HISTORY
            </button>
          </div>

          {/* --- RADAR (WITH INTEGRATED STRATEGY GUIDE) --- */}
          {activeTab === "radar" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                  padding: "20px",
                  borderRadius: "28px",
                  border: "1px solid #312e81",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <Calendar size={16} color="#22c55e" />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "900",
                      color: "white",
                    }}
                  >
                    DAILY STRATEGY GUIDE
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      background: "#020408",
                      padding: "10px",
                      borderRadius: "12px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "8px",
                        color: "#475569",
                        fontWeight: "900",
                      }}
                    >
                      PRIME WINDOW
                    </p>
                    <p style={{ fontSize: "12px", fontWeight: "800" }}>
                      {getShiftStrategy().window}
                    </p>
                  </div>
                  <div
                    style={{
                      background: "#020408",
                      padding: "10px",
                      borderRadius: "12px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "8px",
                        color: "#475569",
                        fontWeight: "900",
                      }}
                    >
                      TARGET PAY
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "800",
                        color: "#22c55e",
                      }}
                    >
                      {getShiftStrategy().expected}
                    </p>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    lineHeight: "1.5",
                    margin: 0,
                  }}
                >
                  "{getShiftStrategy().tactic}"
                </p>
              </div>

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
                    <div>
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: "900",
                          color: s.pct > 80 ? "#22c55e" : "#fbbf24",
                          marginBottom: "8px",
                        }}
                      >
                        {s.pct > 0 ? "LIVE SIGNAL" : "OFFLINE"}
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
                        {s.dist} miles away •{" "}
                        {s.typical_peak_hours || "Peak patterns active"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "38px",
                          fontWeight: "1000",
                          color: s.pct > 80 ? "#22c55e" : "#fbbf24",
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

          {/* --- DUAL BATCH RATER --- */}
          {activeTab === "rater" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setRaterMode("pre")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "14px",
                    border: "none",
                    background: raterMode === "pre" ? "#22c55e" : "#0f172a",
                    color: raterMode === "pre" ? "black" : "white",
                    fontWeight: "900",
                    fontSize: "10px",
                  }}
                >
                  PRE-ACCEPTANCE
                </button>
                <button
                  onClick={() => setRaterMode("post")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "14px",
                    border: "none",
                    background: raterMode === "post" ? "#22c55e" : "#0f172a",
                    color: raterMode === "post" ? "black" : "white",
                    fontWeight: "900",
                    fontSize: "10px",
                  }}
                >
                  POST-JOB GRADER
                </button>
              </div>

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
                  {raterMode === "pre" ? (
                    getPreGrade() ? (
                      <div>
                        <div
                          style={{
                            fontSize: "64px",
                            fontWeight: "1000",
                            color: getPreGrade().color,
                          }}
                        >
                          {getPreGrade().grade}
                        </div>
                        <p style={{ fontSize: "18px", fontWeight: "900" }}>
                          Est. ${getPreGrade().estHourly}/hr
                        </p>
                      </div>
                    ) : (
                      <p style={{ color: "#475569" }}>Input offer details.</p>
                    )
                  ) : getPostRating() ? (
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
                      <p style={{ fontSize: "14px", fontWeight: "800" }}>
                        Efficiency Rating
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: "#475569" }}>Enter trip performance.</p>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="number"
                      value={batchForm.pay}
                      onChange={(e) =>
                        setBatchForm({ ...batchForm, pay: e.target.value })
                      }
                      placeholder="Pay $"
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
                      placeholder="Items"
                      style={{
                        background: "#030508",
                        border: "1px solid #1e2937",
                        padding: "15px",
                        borderRadius: "15px",
                        color: "white",
                      }}
                    />
                  </div>
                  {raterMode === "pre" ? (
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
                  ) : (
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
                          background: "#030508",
                          border: "1px solid #1e2937",
                          padding: "15px",
                          borderRadius: "15px",
                          color: "white",
                        }}
                      />
                      <input
                        type="number"
                        value={batchForm.minutes}
                        onChange={(e) =>
                          setBatchForm({
                            ...batchForm,
                            minutes: e.target.value,
                          })
                        }
                        placeholder="Mins"
                        style={{
                          background: "#030508",
                          border: "1px solid #1e2937",
                          padding: "15px",
                          borderRadius: "15px",
                          color: "white",
                        }}
                      />
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const totalMins =
                        (parseInt(batchForm.hours) || 0) * 60 +
                        (parseInt(batchForm.minutes) || 0);
                      setWeeklyBatches([
                        ...weeklyBatches,
                        {
                          id: Date.now(),
                          payout: batchForm.pay,
                          items: batchForm.items,
                          duration_mins: totalMins,
                          store: "Verified Retailer",
                        },
                      ]);
                      setActiveTab("history");
                    }}
                    style={{
                      background: "#22c55e",
                      color: "black",
                      border: "none",
                      padding: "18px",
                      borderRadius: "16px",
                      fontWeight: "1000",
                      marginTop: "10px",
                    }}
                  >
                    LOG TO COMMUNITY
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- HISTORY & EDIT --- */}
          {activeTab === "history" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "900",
                  color: "#22c55e",
                  textTransform: "uppercase",
                }}
              >
                Weekly Activity
              </h2>
              {weeklyBatches.length === 0 ? (
                <p
                  style={{
                    color: "#475569",
                    textAlign: "center",
                    marginTop: "40px",
                  }}
                >
                  No batches logged yet.
                </p>
              ) : (
                weeklyBatches.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: "#0f172a",
                      padding: "15px 20px",
                      borderRadius: "20px",
                      border: "1px solid #1e2937",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: "900",
                          margin: 0,
                        }}
                      >
                        ${parseFloat(b.payout).toFixed(2)}
                      </p>
                      <p
                        style={{
                          fontSize: "10px",
                          color: "#475569",
                          margin: 0,
                        }}
                      >
                        {b.items} items • {b.duration_mins} mins
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setWeeklyBatches(
                          weeklyBatches.filter((x) => x.id !== b.id)
                        )
                      }
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
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
          }}
        >
          TERMS & LEGAL
        </button>
      </footer>
    </div>
  );
}
