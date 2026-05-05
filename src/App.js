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
  Network,
} from "lucide-react";

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
  const [weeklyBatches, setWeeklyBatches] = useState([]);
  const [batchForm, setBatchForm] = useState({
    pay: "",
    items: "",
    miles: "",
    hours: "",
    minutes: "",
    storeId: "",
  });
  const [mySessionId] = useState(Math.random().toString(36).substring(7));
  const [showLegal, setShowLegal] = useState(false);

  // --- MONDAY RESET & STATS ---
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

  // --- A-F GRADING LOGIC ---
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

  // --- SYNC LOGIC (PRE VS POST) ---
  const handleDataSync = async () => {
    if (!batchForm.storeId) return alert("Select the origin store first.");

    // Both modes update the global algorithm ("Learning")
    await supabase
      .from("stores")
      .update({ heat_level: 95 })
      .eq("id", batchForm.storeId);

    if (raterMode === "post") {
      // Post-Job updates personal history + money
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
          store: "Retailer",
        },
      ]);
      alert("Performance Logged. Personal Stats Updated.");
    } else {
      // Pre-Acceptance only trains the AI, doesn't add to personal money
      alert("Intelligence Injected. Neural radar updated for the community.");
    }

    setBatchForm({
      pay: "",
      items: "",
      miles: "",
      hours: "",
      minutes: "",
      storeId: "",
    });
    setActiveTab("radar");
  };

  // --- AUTH & NAVIGATION ---
  const handleWhopLogin = () => {
    const cleanUrl = window.location.origin + "/";
    window.location.href = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      cleanUrl
    )}&response_type=code&scope=identify`;
  };

  const startProScan = async () => {
    setIsMagicLoading(true);
    const phases = [
      "Establishing Secure Uplink...",
      "Mapping Retail Clusters...",
      "Syncing Neural Data...",
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
        position: "relative",
      }}
    >
      {/* --- PREMIUM ANIMATED BACKGROUND --- */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 60%)",
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 60%)",
          }}
        />
      </div>

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
            <Cpu
              size={70}
              color="#22c55e"
              className="animate-pulse"
              style={{ filter: "drop-shadow(0 0 15px #22c55e)" }}
            />
            <p
              style={{
                marginTop: "25px",
                fontSize: "11px",
                fontWeight: "900",
                color: "#22c55e",
                letterSpacing: "4px",
              }}
            >
              {magicText.toUpperCase()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DASHBOARD HEADER --- */}
      {view !== "landing" && (
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "rgba(2, 4, 8, 0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid #ffffff10",
          }}
        >
          <div
            style={{
              padding: "20px",
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
                  background: "linear-gradient(135deg, #22c55e, #10b981)",
                  padding: "6px",
                  borderRadius: "10px",
                  boxShadow: "0 0 15px rgba(34,197,94,0.3)",
                }}
              >
                <Zap size={18} fill="black" />
              </div>
              <span
                style={{
                  fontSize: "19px",
                  fontWeight: "1000",
                  letterSpacing: "-1px",
                }}
              >
                BATCH<span style={{ color: "#22c55e" }}>SIGNAL</span>
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: "9px",
                  fontWeight: "900",
                  color: "#22c55e",
                  letterSpacing: "1px",
                }}
              >
                HOURLY PERFORMANCE
              </p>
              <p style={{ fontSize: "18px", fontWeight: "1000", margin: 0 }}>
                ${avgHourly}
                <span style={{ fontSize: "10px", color: "#475569" }}>/HR</span>
              </p>
            </div>
          </div>
          {/* PROGRESS BAR */}
          <div style={{ padding: "0 20px 15px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span
                style={{ fontSize: "9px", fontWeight: "900", color: "#94a3b8" }}
              >
                WEEKLY GOAL
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
                height: "5px",
                background: "#0f172a",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid #ffffff05",
              }}
            >
              <motion.div
                animate={{
                  width: `${Math.min((weeklyEarnings / 800) * 100, 100)}%`,
                }}
                transition={{ duration: 1.2 }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #22c55e, #10b981)",
                  boxShadow: "0 0 10px rgba(34,197,94,0.5)",
                }}
              />
            </div>
          </div>
        </nav>
      )}

      {/* --- VIEW: LANDING --- */}
      {view === "landing" && (
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "100px 20px",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1
              style={{
                fontSize: "62px",
                fontWeight: "1000",
                letterSpacing: "-4px",
                marginBottom: "20px",
                lineHeight: "0.85",
              }}
            >
              Predict the <br />
              <span
                style={{
                  color: "#22c55e",
                  textShadow: "0 0 30px rgba(34,197,94,0.3)",
                }}
              >
                Unseen.
              </span>
            </h1>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "18px",
                marginBottom: "45px",
                fontWeight: "500",
              }}
            >
              The only neural-mapped command center for professional shoppers.
            </p>
            {isSubscriber ? (
              <button
                onClick={startProScan}
                style={{
                  background: "linear-gradient(135deg, #22c55e, #10b981)",
                  color: "#000",
                  border: "none",
                  padding: "22px 65px",
                  borderRadius: "20px",
                  fontWeight: "1000",
                  fontSize: "18px",
                  cursor: "pointer",
                  boxShadow: "0 10px 40px rgba(34,197,94,0.25)",
                }}
              >
                INITIALIZE SATELLITE
              </button>
            ) : (
              <div
                style={{
                  background: "rgba(15,23,42,0.6)",
                  backdropFilter: "blur(20px)",
                  padding: "40px",
                  borderRadius: "32px",
                  border: "1px solid #ffffff10",
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
                    marginBottom: "30px",
                  }}
                >
                  PRO Access Required
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
                  }}
                >
                  GET ACCESS NOW
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
                  Existing Member Login
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* --- VIEW: APP DASHBOARD --- */}
      {view === "app" && (
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "20px",
            paddingBottom: "140px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              background: "rgba(15,23,42,0.8)",
              padding: "5px",
              borderRadius: "20px",
              border: "1px solid #ffffff10",
              marginBottom: "25px",
              backdropFilter: "blur(10px)",
            }}
          >
            {["radar", "rater", "history"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "16px",
                  border: "none",
                  background:
                    activeTab === t
                      ? "linear-gradient(135deg, #1e293b, #0f172a)"
                      : "transparent",
                  color: activeTab === t ? "#22c55e" : "#475569",
                  fontWeight: "900",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* --- RADAR TAB (WITH STRATEGY GUIDE) --- */}
          {activeTab === "radar" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #0f172a 0%, #111827 100%)",
                  padding: "25px",
                  borderRadius: "32px",
                  border: "1px solid #ffffff10",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-20px",
                    right: "-20px",
                    width: "80px",
                    height: "80px",
                    background: "#22c55e10",
                    borderRadius: "50%",
                    filter: "blur(30px)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "15px",
                  }}
                >
                  <Calendar size={16} color="#22c55e" />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "900",
                      color: "#94a3b8",
                      letterSpacing: "1px",
                    }}
                  >
                    SHIFT STRATEGY GUIDE
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      background: "#020408",
                      padding: "15px",
                      borderRadius: "18px",
                      border: "1px solid #ffffff05",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "8px",
                        color: "#475569",
                        fontWeight: "900",
                      }}
                    >
                      BEST WINDOW
                    </p>
                    <p style={{ fontSize: "13px", fontWeight: "1000" }}>
                      7:45 AM - 1:00 PM
                    </p>
                  </div>
                  <div
                    style={{
                      background: "#020408",
                      padding: "15px",
                      borderRadius: "18px",
                      border: "1px solid #ffffff05",
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
                        fontSize: "13px",
                        fontWeight: "1000",
                        color: "#22c55e",
                      }}
                    >
                      $28-45/HR
                    </p>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#f8fafc",
                    lineHeight: "1.6",
                    fontWeight: "500",
                  }}
                >
                  "Morning drop volume is high. Position near{" "}
                  <b>Wholesale Hubs</b> (Costco/Sam's) before 8:00 AM. Skip
                  pharmacy orders unless under 2 miles."
                </p>
              </div>

              {stores.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    background: "#0f172a",
                    padding: "24px",
                    borderRadius: "30px",
                    border: "1px solid #ffffff10",
                    borderLeft:
                      s.pct > 85 ? "4px solid #22c55e" : "1px solid #ffffff10",
                    boxShadow:
                      s.pct > 85
                        ? "0 10px 30px -10px rgba(34,197,94,0.15)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "900",
                          color: s.pct > 85 ? "#22c55e" : "#fbbf24",
                        }}
                      >
                        {s.pct > 85 ? "🔥 CRITICAL DROP" : "📡 ACTIVE"}
                      </span>
                      <h3
                        style={{
                          fontSize: "19px",
                          fontWeight: "800",
                          margin: "4px 0",
                        }}
                      >
                        {s.name}
                      </h3>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          fontWeight: "600",
                        }}
                      >
                        {s.dist} miles • {s.typical_peak_hours || "Peak active"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "36px",
                          fontWeight: "1000",
                          color: "#22c55e",
                        }}
                      >
                        {s.pct}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* --- RATER TAB --- */}
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
                    borderRadius: "15px",
                    border: "1px solid #ffffff10",
                    background: raterMode === "pre" ? "#22c55e" : "transparent",
                    color: raterMode === "pre" ? "black" : "white",
                    fontWeight: "1000",
                    fontSize: "11px",
                  }}
                >
                  PRE-ACCEPT
                </button>
                <button
                  onClick={() => setRaterMode("post")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "15px",
                    border: "1px solid #ffffff10",
                    background:
                      raterMode === "post" ? "#22c55e" : "transparent",
                    color: raterMode === "post" ? "black" : "white",
                    fontWeight: "1000",
                    fontSize: "11px",
                  }}
                >
                  POST-JOB
                </button>
              </div>

              <div
                style={{
                  background: "#0f172a",
                  padding: "30px",
                  borderRadius: "35px",
                  border: "1px solid #ffffff10",
                }}
              >
                <div
                  style={{
                    background: "#020408",
                    padding: "30px",
                    borderRadius: "25px",
                    textAlign: "center",
                    marginBottom: "25px",
                    border: "1px solid #ffffff05",
                  }}
                >
                  {raterMode === "pre" ? (
                    getPreGrade() ? (
                      <div>
                        <div
                          style={{
                            fontSize: "72px",
                            fontWeight: "1000",
                            color: getPreGrade().color,
                            textShadow: `0 0 20px ${getPreGrade().color}44`,
                          }}
                        >
                          {getPreGrade().grade}
                        </div>
                        <p
                          style={{
                            fontSize: "20px",
                            fontWeight: "1000",
                            color: "white",
                          }}
                        >
                          Est. ${getPreGrade().estHourly}/HR
                        </p>
                      </div>
                    ) : (
                      <p style={{ color: "#475569", fontWeight: "bold" }}>
                        Enter offer details for neural audit.
                      </p>
                    )
                  ) : getPostRating() ? (
                    <div>
                      <div
                        style={{
                          fontSize: "56px",
                          fontWeight: "1000",
                          color: "#22c55e",
                        }}
                      >
                        {getPostRating().score}%
                      </div>
                      <p style={{ fontSize: "16px", fontWeight: "1000" }}>
                        Efficiency Score
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: "#475569", fontWeight: "bold" }}>
                      Enter trip stats for grade.
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
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
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
                        border: "1px solid #ffffff10",
                        padding: "15px",
                        borderRadius: "18px",
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
                        border: "1px solid #ffffff10",
                        padding: "15px",
                        borderRadius: "18px",
                        color: "white",
                      }}
                    />
                  </div>
                  <input
                    type="number"
                    value={batchForm.miles}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, miles: e.target.value })
                    }
                    placeholder="Total Miles"
                    style={{
                      background: "#030508",
                      border: "1px solid #ffffff10",
                      padding: "15px",
                      borderRadius: "18px",
                      color: "white",
                    }}
                  />
                  {raterMode === "post" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
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
                          border: "1px solid #ffffff10",
                          padding: "15px",
                          borderRadius: "18px",
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
                          border: "1px solid #ffffff10",
                          padding: "15px",
                          borderRadius: "18px",
                          color: "white",
                        }}
                      />
                    </div>
                  )}
                  <select
                    value={batchForm.storeId}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, storeId: e.target.value })
                    }
                    style={{
                      background: "#030508",
                      border: "1px solid #ffffff10",
                      padding: "15px",
                      borderRadius: "18px",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    <option value="">Select Retail Hub...</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleDataSync}
                    style={{
                      background: "linear-gradient(135deg, #22c55e, #10b981)",
                      color: "black",
                      border: "none",
                      padding: "18px",
                      borderRadius: "20px",
                      fontWeight: "1000",
                      marginTop: "10px",
                      cursor: "pointer",
                    }}
                  >
                    {raterMode === "pre"
                      ? "FEED NEURAL NET"
                      : "SYNC COMPLETED BATCH"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- HISTORY TAB --- */}
          {activeTab === "history" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "900",
                  color: "#22c55e",
                  letterSpacing: "1px",
                }}
              >
                WEEKLY ACTIVITY LOG
              </h2>
              {weeklyBatches.length === 0 ? (
                <p
                  style={{
                    color: "#475569",
                    textAlign: "center",
                    marginTop: "40px",
                  }}
                >
                  No data logged for current cycle.
                </p>
              ) : (
                weeklyBatches.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: "#0f172a",
                      padding: "18px 22px",
                      borderRadius: "25px",
                      border: "1px solid #ffffff10",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: "1000",
                          margin: 0,
                        }}
                      >
                        ${parseFloat(b.payout).toFixed(2)}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
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
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "10px",
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
          borderTop: "1px solid #ffffff10",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          zIndex: 100,
        }}
      >
        <button
          onClick={() =>
            alert("Predictive Strategy Feed • No Instacart API connection")
          }
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
