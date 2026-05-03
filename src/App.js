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
} from "lucide-react";

// --- CONFIG ---
const SUPABASE_URL = "https://glprsxjtsqzpjintupls.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_D03Pur4oIlyp2UJiNpdwYg_GYDWs_3o";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BLOCKED_STORES = ["daido", "harrison", "whole foods"];

export default function App() {
  const [view, setView] = useState("landing");
  const [checkerMode, setCheckerMode] = useState("pre");
  const [stores, setStores] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Satellite Offline");
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
  const [showPrivacy, setShowPrivacy] = useState(false);

  // --- 1. POST-JOB PERFORMANCE AUDIT (Analytical Intelligence) ---
  const getPostRating = () => {
    const { pay, items, hours, minutes } = batchForm;
    const totalMins = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    if (!pay || !items || totalMins === 0) return null;

    const hourly = (parseFloat(pay) / totalMins) * 60;
    const spi = (totalMins * 60) / parseInt(items); // Seconds Per Item

    let score = 0;
    score += (hourly / 35) * 50;
    score += Math.max(0, 50 - (spi - 60) * 0.5);
    const finalScore = Math.min(Math.max(Math.round(score), 0), 100);

    // Analytical Tips Engine
    const tips = [];
    if (hourly < 18) {
      tips.push(
        "EARNINGS CRITICAL: Your hourly rate is below the profitable threshold after fuel/taxes. High-item counts for low tips are 'hidden losses'."
      );
    } else if (hourly > 40) {
      tips.push(
        "TOP 1% PERFORMANCE: This payout-to-time ratio is legendary. Pin this store location for this specific time window."
      );
    }

    if (spi > 90) {
      tips.push(
        "SPEED INEFFICIENCY: You are spending over 90s per item. Analytical data suggests deli counters or heavy items are slowing your cycle rate."
      );
    } else if (spi < 50) {
      tips.push(
        "ELITE SPEED: Your sub-50s SPI allows you to clear 25% more batches per shift than competitors."
      );
    }

    if (parseFloat(pay) / parseInt(items) < 0.5) {
      tips.push(
        "VOLUME TRAP: You are doing too much physical labor for the dollar amount. Seek batches with a $1.00 per item minimum."
      );
    }

    return {
      score: finalScore,
      label:
        finalScore > 85
          ? "Legendary"
          : finalScore > 70
          ? "Pro Tier"
          : finalScore > 50
          ? "Average"
          : "Inefficient",
      hourly: Math.round(hourly),
      spi: Math.round(spi),
      tips: tips,
    };
  };

  // --- 2. PRE-ACCEPTANCE LOGIC ---
  const getPreVerdict = () => {
    const { pay, items, miles, count } = batchForm;
    if (!pay || !items || !miles) return null;
    const dollarPerItem = parseFloat(pay) / parseInt(items);
    const dollarPerMile = parseFloat(pay) / parseFloat(miles);
    let score = 50;
    if (dollarPerItem >= 1.2) score += 20;
    if (dollarPerMile >= 2.0) score += 25;
    if (parseInt(count) > 1) score -= 15;
    if (score >= 75)
      return {
        type: "ACCEPT",
        color: "#22c55e",
        icon: <CheckCircle2 size={32} />,
        text: "STRATEGIC MATCH: High pay-to-distance ratio. Grab immediately.",
      };
    if (score >= 45)
      return {
        type: "MAYBE",
        color: "#fbbf24",
        icon: <AlertCircle size={32} />,
        text: "MARGINAL: Accept only if the drop-off is near a high-volume hub.",
      };
    return {
      type: "DECLINE",
      color: "#ef4444",
      icon: <XCircle size={32} />,
      text: "UNPROFITABLE: This batch will likely lower your daily hourly average.",
    };
  };

  const calculateIntelligence = (store) => {
    const hr = new Date().getHours();
    const isOpen =
      hr >= (store.open_hour || 8) && hr < (store.close_hour || 21);
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

  const startProScan = async () => {
    setLoading(true);
    setStatus("Syncing Neural Link...");
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const { latitude: lat, longitude: lng } = p.coords;
        setUserLoc({ lat, lng });
        const { data: raw } = await supabase.rpc("get_nearby_stores", {
          user_lat: lat,
          user_lng: lng,
          radius_miles: 15,
        });
        if (raw) {
          const R = 3958.8;
          setStores(
            raw
              .filter(
                (s) =>
                  !BLOCKED_STORES.some((b) => s.name.toLowerCase().includes(b))
              )
              .map((s) => {
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
                return { ...s, ...calculateIntelligence(s), dist };
              })
              .sort((a, b) => b.percent - a.percent)
          );
          setView("radar");
          setStatus("System Live");
        }
        setLoading(false);
      },
      () => {
        alert("GPS REQUIRED");
        setLoading(false);
      }
    );
  };

  return (
    <div
      style={{
        backgroundColor: "#020408",
        minHeight: "100vh",
        color: "#f8fafc",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
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
            <Zap size={18} fill="black" color="black" />
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "1000",
              letterSpacing: "-1px",
            }}
          >
            BATCH<span style={{ color: "#22c55e" }}>SIGNAL</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={() => setView("checker")}
            style={{
              background: "none",
              border: "none",
              color: view === "checker" ? "#22c55e" : "#94a3b8",
              fontSize: "11px",
              fontWeight: "900",
              cursor: "pointer",
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
              cursor: "pointer",
            }}
          >
            RADAR
          </button>
        </div>
      </nav>

      {/* LANDING VIEW */}
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
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "20px",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              <TrendingUp size={14} /> EARN $800+ WEEKLY
            </div>
            <h1
              style={{
                fontSize: "48px",
                fontWeight: "1000",
                lineHeight: "1",
                marginBottom: "20px",
                letterSpacing: "-2px",
              }}
            >
              Detect High-Value <br />
              <span style={{ color: "#22c55e" }}>Batch Drops in Real-Time</span>
            </h1>
            <p
              style={{
                color: "#64748b",
                fontSize: "16px",
                marginBottom: "40px",
              }}
            >
              Join 1,000+ shoppers using algorithmic mapping to win.
            </p>
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
                cursor: "pointer",
              }}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "SCAN MY AREA NOW"
              )}
            </button>
          </motion.div>
        </div>
      )}

      {/* RADAR VIEW */}
      {view === "radar" && (
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "20px",
            paddingBottom: "120px",
          }}
        >
          {stores.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
                      background: `${s.color}15`,
                      display: "inline-block",
                      padding: "3px 8px",
                      borderRadius: "6px",
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
                    {s.dist} miles away
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
                  <div
                    style={{
                      fontSize: "8px",
                      fontWeight: "900",
                      color: "#475569",
                    }}
                  >
                    STRENGTH
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`,
                    "_blank"
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
                  cursor: "pointer",
                }}
              >
                NAVIGATE
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* TOOLS VIEW */}
      {view === "checker" && (
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
                fontSize: "11px",
              }}
            >
              PRE-ACCEPTANCE
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
                fontSize: "11px",
              }}
            >
              POST-JOB GRADER
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
                padding: "25px",
                borderRadius: "24px",
                textAlign: "center",
                border: "1px solid #1e2937",
                marginBottom: "25px",
              }}
            >
              {checkerMode === "pre" ? (
                <>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "900",
                      color: "#475569",
                    }}
                  >
                    DECISION SIGNAL
                  </div>
                  {getPreVerdict() ? (
                    <div style={{ marginTop: "10px" }}>
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "1000",
                          color: getPreVerdict().color,
                        }}
                      >
                        {getPreVerdict().type}
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#f8fafc",
                          marginTop: "10px",
                          fontWeight: "600",
                        }}
                      >
                        {getPreVerdict().text}
                      </p>
                    </div>
                  ) : (
                    <p
                      style={{
                        color: "#475569",
                        fontSize: "12px",
                        marginTop: "15px",
                      }}
                    >
                      Input batch details for a verdict.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "900",
                      color: "#475569",
                    }}
                  >
                    EFFICIENCY GRADE
                  </div>
                  {getPostRating() ? (
                    <div style={{ marginTop: "10px" }}>
                      <div
                        style={{
                          fontSize: "52px",
                          fontWeight: "1000",
                          color: "#22c55e",
                        }}
                      >
                        {getPostRating().score}%
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "800",
                          color: "#fbbf24",
                        }}
                      >
                        {getPostRating().label}
                      </div>
                      <div
                        style={{
                          marginTop: "15px",
                          textAlign: "left",
                          background: "#0f172a",
                          padding: "15px",
                          borderRadius: "15px",
                          border: "1px solid #1e2937",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "10px",
                            fontWeight: "900",
                            color: "#22c55e",
                            marginBottom: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <BarChart4 size={12} /> AI PERFORMANCE AUDIT
                        </p>
                        {getPostRating().tips.map((tip, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: "11px",
                              color: "#94a3b8",
                              marginBottom: "8px",
                              display: "flex",
                              gap: "8px",
                            }}
                          >
                            <Lightbulb
                              size={14}
                              color="#fbbf24"
                              style={{ flexShrink: 0 }}
                            />{" "}
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p
                      style={{
                        color: "#475569",
                        fontSize: "12px",
                        marginTop: "15px",
                      }}
                    >
                      Enter completed trip data for an audit.
                    </p>
                  )}
                </>
              )}
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
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
              </div>
              {checkerMode === "pre" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <input
                    type="number"
                    value={batchForm.miles}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, miles: e.target.value })
                    }
                    placeholder="Miles"
                    style={{
                      background: "#020408",
                      border: "1px solid #1e2937",
                      padding: "15px",
                      borderRadius: "14px",
                      color: "white",
                    }}
                  />
                  <select
                    value={batchForm.count}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, count: e.target.value })
                    }
                    style={{
                      background: "#020408",
                      border: "1px solid #1e2937",
                      padding: "15px",
                      borderRadius: "14px",
                      color: "white",
                    }}
                  >
                    <option value="1">Single</option>
                    <option value="2">Double</option>
                    <option value="3">Triple</option>
                  </select>
                </div>
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
                    placeholder="Hours"
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
              )}
            </div>
          </div>
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
          PRIVACY POLICY
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
              LEGAL DISCLOSURE
            </h2>
            <p
              style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.6" }}
            >
              BatchSignal is a predictive tool. Not affiliated with Instacart.
              Payout estimates are algorithmic and not guaranteed income. Use
              while parked only.
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
              I AGREE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
