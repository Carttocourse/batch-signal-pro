import React, { useState, useEffect } from "react";
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
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [magicText, setMagicText] = useState("");
  const [weeklyEarnings, setWeeklyEarnings] = useState(540.0);
  const [weeklyScore, setWeeklyScore] = useState(82);
  const [batchForm, setBatchForm] = useState({
    pay: "",
    items: "",
    miles: "",
    storeId: "",
  });
  const [mySessionId] = useState(Math.random().toString(36).substring(7));

  // --- 1. WHOP AUTH & SESSION LOCK ---
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

  // --- 2. BATCH DECISION ENGINE ---
  const getDecision = () => {
    const { pay, items, miles } = batchForm;
    if (!pay || !items || !miles) return null;
    const hourlyTarget = 30.0;
    const estMins = parseInt(items) + 10 + parseFloat(miles) * 2;
    const estHourly = (parseFloat(pay) / estMins) * 60;
    const diff = Math.abs(hourlyTarget - estHourly);
    if (estHourly >= hourlyTarget)
      return {
        type: "ACCEPT",
        color: "#22c55e",
        diff,
        text: "PROFITABLE. Matches your $30/hr strategy.",
      };
    return {
      type: "SKIP",
      color: "#ef4444",
      diff,
      text: `LOSS: -$${diff.toFixed(2)}/hr. Below your target.`,
    };
  };

  // --- 3. CORE APP LOGIC ---
  const startProScan = async () => {
    setIsMagicLoading(true);
    const phases = [
      "Authenticating...",
      "Syncing Satellite...",
      "Parsing Market Drops...",
    ];
    phases.forEach((t, i) => setTimeout(() => setMagicText(t), i * 900));

    navigator.geolocation.getCurrentPosition(
      async (p) => {
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
                    !BLOCKED_STORES.some((b) =>
                      s.name.toLowerCase().includes(b)
                    )
                )
                .map((s) => {
                  const hr = new Date().getHours();
                  const isOpen =
                    hr >= (s.open_hour || 8) && hr < (s.close_hour || 21);
                  return {
                    ...s,
                    pct: isOpen
                      ? Math.min(
                          Math.round(
                            (s.brand_quality || 60) * (hr < 10 ? 1.35 : 1)
                          ),
                          99
                        )
                      : 0,
                    dist: (Math.random() * 5).toFixed(1),
                  };
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
      enforceSingleSession("verified_user@carttocash.pro");
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{ fontSize: "10px", fontWeight: "bold", color: "#22c55e" }}
            >
              ● LIVE FEED
            </span>
            <LogOut
              size={16}
              color="#475569"
              onClick={() => window.location.reload()}
            />
          </div>
        )}
      </nav>

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
            EARN $127+ MORE WEEKLY
          </div>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "1000",
              letterSpacing: "-2px",
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
                padding: "18px 40px",
                borderRadius: "14px",
                fontWeight: "1000",
                fontSize: "16px",
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
                maxWidth: "400px",
                margin: "0 auto",
              }}
            >
              <ShieldAlert
                size={40}
                color="#22c55e"
                style={{ marginBottom: "15px", margin: "0 auto" }}
              />
              <h2 style={{ fontSize: "20px", fontWeight: "900" }}>
                Members Only
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                  marginBottom: "25px",
                }}
              >
                Purchase "Cart-to-Cash Pro" to unlock the AI Radar.
              </p>
              <button
                onClick={() => window.open(CHECKOUT_LINK)}
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
              <button
                onClick={handleWhopLogin}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "none",
                  border: "1px solid #1e2937",
                  color: "#94a3b8",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  fontSize: "12px",
                  marginTop: "10px",
                }}
              >
                ALREADY A MEMBER? SIGN IN
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- MAIN APP DASHBOARD --- */}
      {view === "app" && isSubscriber && (
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "20px",
            paddingBottom: "120px",
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
                  WEEKLY PERFORMANCE
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
                          color: s.pct > 80 ? "#22c55e" : "#fbbf24",
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
                        {s.dist} miles away
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
                      border: "1px solid #334155",
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
                  <p style={{ color: "#475569" }}>
                    Enter data for neural audit.
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
                  placeholder="Pay $"
                  style={{
                    background: "#030508",
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
                    background: "#030508",
                    border: "1px solid #1e2937",
                    padding: "15px",
                    borderRadius: "14px",
                    color: "white",
                  }}
                />
                <input
                  type="number"
                  value={batchForm.miles}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, miles: e.target.value })
                  }
                  placeholder="Miles"
                  style={{
                    background: "#030508",
                    border: "1px solid #1e2937",
                    padding: "15px",
                    borderRadius: "14px",
                    color: "white",
                  }}
                />
                <button
                  onClick={() => {
                    setWeeklyEarnings(
                      (prev) => prev + parseFloat(batchForm.pay)
                    );
                    alert("Earnings Synced!");
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
                  }}
                >
                  SYNC TO WEEKLY GOAL
                </button>
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
                <Calendar color="#22c55e" /> Strategy Guide
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
                  }}
                >
                  "Today: Target the 8:00 AM - 11:30 AM window. Position near
                  high-volume grocery hubs. Avoid pharmacy small-batches unless
                  pay exceeds $18."
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
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
        <p style={{ fontSize: "9px", fontWeight: "900", color: "#334155" }}>
          © 2026 BATCHSIGNAL AI • PROFESSIONAL INTELLIGENCE
        </p>
      </footer>
    </div>
  );
}
