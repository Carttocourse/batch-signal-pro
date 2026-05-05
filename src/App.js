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
  Users,
  Calendar,
  Target,
  TrendingDown,
  Timer,
} from "lucide-react";

// --- CONFIG ---
const SUPABASE_URL = "https://glprsxjtsqzpjintupls.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_D03Pur4oIlyp2UJiNpdwYg_GYDWs_3o";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  const [weeklyEarnings, setWeeklyEarnings] = useState(542.5);
  const [weeklyScore, setWeeklyScore] = useState(84);
  const [batchCount, setBatchCount] = useState(12);
  const [batchForm, setBatchForm] = useState({
    pay: "",
    items: "",
    miles: "",
    hours: "",
    minutes: "",
    storeId: "",
  });
  const [mySessionId] = useState(Math.random().toString(36).substring(7));

  // --- 1. ANTI-ABUSE & RATING LOGIC ---
  const getBatchRating = () => {
    const { pay, items, hours, minutes, miles } = batchForm;
    const totalMins = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    if (!pay || !items || totalMins === 0) return null;

    const hourly = (parseFloat(pay) / totalMins) * 60;
    const hourlyTarget = 30.0;

    // Anti-Abuse Check: Flag if numbers are physically impossible
    const isSuspicious =
      hourly > 200 ||
      parseFloat(pay) / parseInt(items) > 20 ||
      totalMins / parseInt(items) < 0.1;
    if (isSuspicious)
      return {
        type: "ERROR",
        color: "#f87171",
        text: "UNREALISTIC DATA: Neural net rejected this entry. Check your numbers.",
      };

    const diff = Math.abs(hourlyTarget - hourly);
    if (hourly >= hourlyTarget) {
      return {
        type: "ACCEPT",
        color: "#22c55e",
        score: Math.min(Math.round((hourly / hourlyTarget) * 70), 100),
        text: `PROFITABLE. +$${diff.toFixed(2)}/hr above target.`,
      };
    } else {
      return {
        type: "SKIP",
        color: "#ef4444",
        score: Math.round((hourly / hourlyTarget) * 70),
        text: `LOSS: -$${diff.toFixed(2)}/hr. Below your target.`,
      };
    }
  };

  // --- 2. WHOP AUTH & SESSION LOCK ---
  const handleWhopLogin = () => {
    const cleanUrl = window.location.origin + "/";
    window.location.href = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      cleanUrl
    )}&response_type=code&scope=identify`;
  };

  const enforceSingleSession = async (email) => {
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
        alert("Session Expired: Logged in on another device.");
        window.location.href = window.location.origin;
      }
    }, 15000);
  };

  // --- 3. INTELLIGENCE ENGINE (FIXED CLOSED-STORE LOGIC) ---
  const calculateIntel = (store) => {
    const hr = new Date().getHours();
    const open = store.open_hour || 8;
    const close = store.close_hour || 21;

    // Strict logic: If store is closed, it's 0% and OFFLINE
    const isOpen = hr >= open && hr < close;
    if (!isOpen)
      return {
        pct: 0,
        color: "#1e293b",
        label: "OFFLINE",
        subtext: `Opens at ${open}:00 AM`,
      };

    let score = store.brand_quality || 60;
    if (hr >= 7 && hr <= 10) score += 20;

    // Imminent Peak Logic
    let subtext = "Active Drop Window";
    if (hr === open) subtext = "MORNING DROP ACTIVE";
    if (hr === close - 1) subtext = "FINAL DAILY SPIKE";

    return {
      pct: Math.min(score, 99),
      color: score > 85 ? "#22c55e" : "#fbbf24",
      label: score > 85 ? "CRITICAL" : "ACTIVE",
      subtext,
    };
  };

  const startProScan = async () => {
    setIsMagicLoading(true);
    const phases = [
      "Syncing Satellite...",
      "Parsing Market Drops...",
      "Calculating Trends...",
    ];
    phases.forEach((t, i) => setTimeout(() => setMagicText(t), i * 900));

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
                  const dist = (
                    R *
                    2 *
                    Math.atan2(
                      Math.sqrt(
                        Math.sin(((s.latitude - lat) * Math.PI) / 180 / 2) **
                          2 +
                          Math.cos((lat * Math.PI) / 180) *
                            Math.cos((s.latitude * Math.PI) / 180) *
                            Math.sin(
                              ((s.longitude - lng) * Math.PI) / 180 / 2
                            ) **
                              2
                      ),
                      Math.sqrt(
                        1 -
                          (Math.sin(((s.latitude - lat) * Math.PI) / 180 / 2) **
                            2 +
                            Math.cos((lat * Math.PI) / 180) *
                              Math.cos((s.latitude * Math.PI) / 180) *
                              Math.sin(
                                ((s.longitude - lng) * Math.PI) / 180 / 2
                              ) **
                                2)
                      )
                    )
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

      {/* --- HEADER --- */}
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
              {status.toUpperCase()}
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
            <h1
              style={{
                fontSize: "52px",
                fontWeight: "1000",
                letterSpacing: "-3px",
                marginBottom: "20px",
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
                  GET ACCESS
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
                  Already a member? Sign in
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
                  }}
                >
                  WEEKLY SCORE
                </p>
                <p
                  style={{
                    fontSize: "32px",
                    fontWeight: "1000",
                    color: "white",
                    margin: 0,
                  }}
                >
                  {weeklyScore}
                  <span style={{ fontSize: "14px", color: "#475569" }}>
                    /100
                  </span>
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
                  ${weeklyEarnings.toFixed(2)}
                </p>
                <p
                  style={{
                    fontSize: "9px",
                    fontWeight: "800",
                    color: "#475569",
                  }}
                >
                  GOAL: $800
                </p>
              </div>
            </div>
            <div
              style={{
                height: "8px",
                background: "#020408",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(weeklyEarnings / 800) * 100}%` }}
                transition={{ duration: 1.5 }}
                style={{ height: "100%", background: "#22c55e" }}
              />
            </div>
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
          </div>

          {/* --- RADAR (INTEGRATED TRENDS) --- */}
          {activeTab === "radar" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
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
                          marginTop: "6px",
                        }}
                      >
                        {s.subtext}
                      </p>

                      {/* TYPICAL TRENDS INTEGRATION */}
                      <div
                        style={{
                          marginTop: "15px",
                          padding: "10px",
                          background: "#020408",
                          borderRadius: "12px",
                          border: "1px solid #111827",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "9px",
                            fontWeight: "900",
                            color: "#475569",
                            textTransform: "uppercase",
                            marginBottom: "4px",
                          }}
                        >
                          Typical Peak Behavior
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#94a3b8",
                            margin: 0,
                          }}
                        >
                          {s.typical_peak_hours || "Peak patterns sync in 24h"}
                        </p>
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

          {/* --- BATCH RATER (ANTI-ABUSE) --- */}
          {activeTab === "rater" && (
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
                  marginBottom: "25px",
                  border: "1px solid #1e2937",
                }}
              >
                {getBatchRating() ? (
                  <div>
                    <div
                      style={{
                        fontSize: "42px",
                        fontWeight: "1000",
                        color: getBatchRating().color,
                      }}
                    >
                      {getBatchRating().type}
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "white",
                        marginTop: "10px",
                        fontWeight: "600",
                      }}
                    >
                      {getBatchRating().text}
                    </p>
                  </div>
                ) : (
                  <p style={{ color: "#475569", fontSize: "14px" }}>
                    Input batch for neural audit.
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
                      setBatchForm({ ...batchForm, minutes: e.target.value })
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
                    const r = getBatchRating();
                    if (r.type === "ERROR")
                      return alert("Entry blocked: Unrealistic data.");
                    setWeeklyEarnings(
                      (prev) => prev + parseFloat(batchForm.pay)
                    );
                    alert("Neural Net Updated.");
                    setActiveTab("radar");
                  }}
                  style={{
                    background: "#22c55e",
                    color: "black",
                    border: "none",
                    padding: "18px",
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
              Predictive tool. Not affiliated with Instacart. Payouts estimates
              are algorithmic and not guaranteed income.
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
