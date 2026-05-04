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
  const [notifications, setNotifications] = useState([]);
  const [batchForm, setBatchForm] = useState({
    pay: "",
    items: "",
    miles: "",
    hours: "",
    minutes: "",
  });
  const [showLegal, setShowLegal] = useState(false);
  const [wins, setWins] = useState([
    { id: 1, user_name: "Maria S.", amount: 342.5, label: "DAILY TOTAL" },
    { id: 2, user_name: "Marcus K.", amount: 38.4, label: "HOURLY RECORD" },
    { id: 3, user_name: "David L.", amount: 52.0, label: "SINGLE BATCH WIN" },
  ]);

  const magicPhases = [
    "Establishing Neural Link...",
    "Analyzing Retail Clusters...",
    "Detecting Batch Drops...",
    "Finalizing Command Center...",
  ];

  // --- 1. WHOP AUTH ---
  const handleWhopLogin = () => {
    const cleanUrl = window.location.origin + "/";
    window.location.href = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      cleanUrl
    )}&response_type=code&scope=identify`;
  };

  // --- 2. BATCH DECISION ENGINE (LOSS VISUALIZER) ---
  const getDecision = () => {
    const { pay, items, miles } = batchForm;
    if (!pay || !items || !miles) return null;

    const hourlyTarget = 30.0;
    const estMins = parseInt(items) + 10 + parseFloat(miles) * 2;
    const estHourly = (parseFloat(pay) / estMins) * 60;
    const diff = Math.abs(hourlyTarget - estHourly);

    if (estHourly >= hourlyTarget) {
      return {
        type: "ACCEPT",
        color: "#22c55e",
        diff,
        text: "STRATEGIC MATCH. This adds to your hourly average.",
      };
    } else {
      return {
        type: "SKIP",
        color: "#ef4444",
        diff,
        text: `LOSS DETECTED: -$${diff.toFixed(
          2
        )}/hr. This is below your target.`,
      };
    }
  };

  // --- 3. CORE LOGIC ---
  const calculateIntel = (store) => {
    const hr = new Date().getHours();
    const isOpen =
      hr >= (store.open_hour || 8) && hr < (store.close_hour || 21);
    if (!isOpen) return { pct: 0, color: "#1e293b", label: "OFFLINE" };
    let score = store.brand_quality || 60;
    if (hr >= 7 && hr <= 10) score += 20;
    const final = Math.min(score, 99);
    return {
      pct: final,
      color: final > 85 ? "#22c55e" : "#fbbf24",
      label: final > 85 ? "CRITICAL" : "ACTIVE",
    };
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
                .map((s) => ({
                  ...s,
                  ...calculateIntel(s),
                  dist: (Math.random() * 5).toFixed(1),
                }))
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
    if (urlParams.get("code")) setIsSubscriber(true);
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
        {!isSubscriber ? (
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
        ) : (
          <div
            style={{
              background: "#0f172a",
              padding: "5px 12px",
              borderRadius: "20px",
              border: "1px solid #1e2937",
              fontSize: "9px",
              fontWeight: "900",
              color: "#22c55e",
            }}
          >
            PRO ACTIVE
          </div>
        )}
      </nav>

      {/* --- VIEW: LANDING --- */}
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
                fontSize: "56px",
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
            <p
              style={{
                color: "#64748b",
                fontSize: "18px",
                marginBottom: "40px",
              }}
            >
              Join 1,000+ pro-shoppers using satellite market mapping.
            </p>

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
                    fontSize: "20px",
                    fontWeight: "900",
                    marginBottom: "10px",
                  }}
                >
                  Members Only
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#94a3b8",
                    marginBottom: "30px",
                  }}
                >
                  Unlock the Radar, AI Decision Engine, and Shift Planner.
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

      {/* --- VIEW: APP DASHBOARD --- */}
      {view === "app" && (
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "20px",
            paddingBottom: "120px",
          }}
        >
          {/* Satisfying Weekly Goal Bar */}
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
                  WEEKLY PROGRESS
                </p>
                <p
                  style={{
                    fontSize: "32px",
                    fontWeight: "1000",
                    color: "white",
                    margin: 0,
                  }}
                >
                  $540.00
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
                  82% OF GOAL
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
                height: "8px",
                background: "#020408",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "82%" }}
                transition={{ duration: 1.5 }}
                style={{ height: "100%", background: "#22c55e" }}
              />
            </div>
          </div>

          {/* Tab Nav */}
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

          {/* SUB-VIEWS */}
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
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: "900",
                          color: s.pct > 0 ? "#22c55e" : "#475569",
                          marginBottom: "5px",
                          display: "block",
                        }}
                      >
                        {s.label} SIGNAL
                      </span>
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
                          marginTop: "5px",
                        }}
                      >
                        Position now. Peak starts in 15m.
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "38px",
                          fontWeight: "1000",
                          color: s.color,
                          lineHeight: 1,
                        }}
                      >
                        {s.pct}%
                      </div>
                      <div
                        style={{
                          fontSize: "8px",
                          fontWeight: "900",
                          color: "#475569",
                        }}
                      >
                        DROP PROB.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

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
                  marginBottom: "25px",
                  border: "1px solid #1e2937",
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
                        fontSize: "12px",
                        color: "#f8fafc",
                        marginTop: "10px",
                      }}
                    >
                      {getDecision().text}
                    </p>
                  </div>
                ) : (
                  <p style={{ color: "#475569", fontWeight: "bold" }}>
                    Enter metrics for AI verdict.
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
              </div>
            </div>
          )}

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
                <Calendar color="#22c55e" /> Today's Strategy
              </h2>
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
                  "Target a 4-hour block starting at 8:00 AM. Shift goal:
                  $120.00 across 4 high-payout batches."
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- COMMUNITY TICKER --- */}
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
            {wins.map((w) => (
              <div
                key={w.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "11px",
                  fontWeight: "900",
                }}
              >
                <span style={{ color: "#94a3b8" }}>{w.user_name}</span>
                <span style={{ color: "#22c55e" }}>
                  +${w.amount.toFixed(2)}
                </span>
                <span style={{ color: "#475569" }}>[{w.label}]</span>
              </div>
            ))}
          </motion.div>
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
              are algorithmic and not guaranteed income. Use while parked only.
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
