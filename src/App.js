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
  Edit3,
  ArrowRight,
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
  const [raterMode, setRaterMode] = useState("pre"); // 'pre' or 'post'
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

  // --- 1. MONDAY RESET LOGIC ---
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
    (sum, b) => sum + parseFloat(b.payout),
    0
  );

  // --- 2. THE A-F GRADING ENGINE (PRE-ACCEPTANCE) ---
  const getPreGrade = () => {
    const { pay, items, miles } = batchForm;
    if (!pay || !items || !miles) return null;

    const hr = new Date().getHours();
    const day = new Date().getDay();

    // Estimate total time: 1.2m/item + 2.5m/mile + 10m fixed
    const estMins = parseInt(items) * 1.2 + parseFloat(miles) * 2.5 + 10;
    const estHourly = (parseFloat(pay) / estMins) * 60;

    let grade = "F";
    let color = "#ef4444";
    if (estHourly >= 35) {
      grade = "A";
      color = "#22c55e";
    } else if (estHourly >= 28) {
      grade = "B";
      color = "#10b981";
    } else if (estHourly >= 22) {
      grade = "C";
      color = "#fbbf24";
    } else if (estHourly >= 18) {
      grade = "D";
      color = "#f97316";
    }

    // Market Analysis
    let marketAdvice = "Low chance of better signal soon.";
    if ((day === 0 || day === 6) && hr < 11)
      marketAdvice = "85% CHANCE of a better signal in < 15 mins. HOLD.";

    return { grade, estHourly: Math.round(estHourly), color, marketAdvice };
  };

  // --- 3. WHOP & SYSTEM LOGIC ---
  const handleWhopLogin = () => {
    const cleanUrl = window.location.origin + "/";
    window.location.href = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      cleanUrl
    )}&response_type=code&scope=identify`;
  };

  const startProScan = async () => {
    setIsMagicLoading(true);
    const phases = ["Syncing GPS...", "Optimizing Neural Map...", "Live!"];
    phases.forEach((t, i) => setTimeout(() => setMagicText(t), i * 1000));

    navigator.geolocation.getCurrentPosition(async (p) => {
      const { data: raw } = await supabase.rpc("get_nearby_stores", {
        user_lat: p.coords.latitude,
        user_lng: p.coords.longitude,
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
              .sort((a, b) => b.brand_quality - a.brand_quality)
          );
          setView("app");
          setIsMagicLoading(false);
        }
      }, 3000);
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
        overflowX: "hidden",
      }}
    >
      {/* --- COOL MOVING BACKGROUND --- */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.4 }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "60%",
            height: "60%",
            background:
              "radial-gradient(circle, #22c55e33 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "-10%",
            width: "60%",
            height: "60%",
            background:
              "radial-gradient(circle, #3b82f622 0%, transparent 70%)",
            filter: "blur(80px)",
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
            <Cpu size={64} color="#22c55e" className="animate-pulse" />
            <p
              style={{
                marginTop: "24px",
                fontSize: "12px",
                fontWeight: "900",
                color: "#22c55e",
                letterSpacing: "3px",
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
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #ffffff10",
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "rgba(2,4,8,0.8)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Zap size={22} color="#22c55e" fill="#22c55e" />
            <span
              style={{
                fontSize: "20px",
                fontWeight: "1000",
                letterSpacing: "-1px",
              }}
            >
              BATCH<span style={{ color: "#22c55e" }}>SIGNAL</span>
            </span>
          </div>
          <div
            onClick={() => setActiveTab("history")}
            style={{ cursor: "pointer", textAlign: "right" }}
          >
            <p
              style={{ fontSize: "10px", fontWeight: "900", color: "#22c55e" }}
            >
              WEEKLY EARNINGS
            </p>
            <p style={{ fontSize: "16px", fontWeight: "1000", margin: 0 }}>
              ${weeklyEarnings.toFixed(2)}
            </p>
          </div>
        </nav>
      )}

      {/* --- VIEW: LANDING --- */}
      {view === "landing" && (
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "80px 20px",
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
                fontSize: "64px",
                fontWeight: "1000",
                letterSpacing: "-4px",
                marginBottom: "20px",
                lineHeight: "0.85",
              }}
            >
              Precision <br />
              <span style={{ color: "#22c55e" }}>Intelligence.</span>
            </h1>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "18px",
                marginBottom: "40px",
                maxWidth: "500px",
                margin: "0 auto 40px",
              }}
            >
              Join the elite 1% of shoppers using neural-mapped retail drops.
            </p>
            {isSubscriber ? (
              <button
                onClick={startProScan}
                style={{
                  background: "#22c55e",
                  color: "#000",
                  border: "none",
                  padding: "22px 60px",
                  borderRadius: "18px",
                  fontWeight: "1000",
                  fontSize: "18px",
                  cursor: "pointer",
                  boxShadow: "0 0 40px #22c55e44",
                }}
              >
                ENTER COMMAND CENTER
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
                <h2 style={{ fontSize: "24px", fontWeight: "900" }}>
                  Authentication Required
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
                    marginTop: "20px",
                  }}
                >
                  UPGRADE TO PRO
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
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#0f172a",
              padding: "5px",
              borderRadius: "20px",
              border: "1px solid #1e2937",
              marginBottom: "20px",
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
                  background: activeTab === t ? "#1e293b" : "transparent",
                  color: activeTab === t ? "#22c55e" : "#475569",
                  fontWeight: "900",
                  fontSize: "11px",
                  textTransform: "uppercase",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* --- RADAR --- */}
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
                    border: "1px solid #1e2937",
                    borderLeft:
                      s.brand_quality > 85
                        ? "4px solid #22c55e"
                        : "1px solid #1e2937",
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
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "900",
                          color: "#22c55e",
                        }}
                      >
                        {s.brand_quality > 85 ? "🔥 HIGH YIELD" : "📡 ACTIVE"}
                      </span>
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: "800",
                          margin: "4px 0",
                          color: "white",
                        }}
                      >
                        {s.name}
                      </h3>
                      <p style={{ fontSize: "11px", color: "#64748b" }}>
                        {s.address || "Area Verified"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "1000",
                          color: "#22c55e",
                        }}
                      >
                        {s.brand_quality}%
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
                    padding: "10px",
                    borderRadius: "12px",
                    border: "1px solid #1e2937",
                    background: raterMode === "pre" ? "#22c55e" : "transparent",
                    color: raterMode === "pre" ? "black" : "white",
                    fontWeight: "900",
                    fontSize: "11px",
                  }}
                >
                  PRE-ACCEPTANCE
                </button>
                <button
                  onClick={() => setRaterMode("post")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "12px",
                    border: "1px solid #1e2937",
                    background:
                      raterMode === "post" ? "#22c55e" : "transparent",
                    color: raterMode === "post" ? "black" : "white",
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
                  {raterMode === "pre" && getPreGrade() ? (
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
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#94a3b8",
                          marginTop: "10px",
                        }}
                      >
                        {getPreGrade().marketAdvice}
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: "#475569" }}>
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

                  {raterMode === "post" && (
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
                      setWeeklyBatches([
                        ...weeklyBatches,
                        {
                          id: Date.now(),
                          payout: batchForm.pay,
                          items: batchForm.items,
                          store: batchForm.storeName || "Retailer",
                        },
                      ]);
                      alert("Batch Logged!");
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
                      cursor: "pointer",
                    }}
                  >
                    LOG COMPLETED BATCH
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- BATCH HISTORY (FEATURE 2) --- */}
          {activeTab === "history" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "900",
                  color: "#22c55e",
                }}
              >
                Weekly Log
              </h2>
              {weeklyBatches.length === 0 ? (
                <p
                  style={{
                    color: "#475569",
                    textAlign: "center",
                    marginTop: "40px",
                  }}
                >
                  No batches logged this week.
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
                          fontSize: "11px",
                          color: "#475569",
                          margin: 0,
                        }}
                      >
                        {b.items} items • {b.store}
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
                        cursor: "pointer",
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
          onClick={() =>
            alert("Predictive tool. Not affiliated with Instacart.")
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
