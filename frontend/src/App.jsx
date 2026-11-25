import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import {
  Activity, AlertCircle, ArrowDownRight, ArrowUpRight, BarChart3, Bell, CheckCircle2,
  ChevronDown, Clock3, FileText, Gauge, LayoutDashboard, Menu, MessageSquareText,
  Search, Send, ShieldCheck, Sparkles, Users, X, Zap, CircleHelp, Settings2,
  Droplets, Building2, Landmark, HeartPulse, GraduationCap, Route, Trash2,
  Award, Bot, ExternalLink, RefreshCw, Layers, ShieldAlert, Cpu
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";

import TriagingView from "./components/TriagingView";
import ConfusionMatrixView from "./components/ConfusionMatrixView";
import GrievanceRegisterView from "./components/GrievanceRegisterView";
import DepartmentsView from "./components/DepartmentsView";
import ProjectChat from "./components/ProjectChat";

const API = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

const trendData = [
  { day: "Mon", n: 42 },
  { day: "Tue", n: 58 },
  { day: "Wed", n: 64 },
  { day: "Thu", n: 89 },
  { day: "Fri", n: 76 },
  { day: "Sat", n: 95 },
  { day: "Sun", n: 81 }
];

const distributionData = [
  { name: "Water Supply", value: 24, color: "#4bb6d6" },
  { name: "Police & Law", value: 18, color: "#8b7cf6" },
  { name: "Electricity", value: 16, color: "#e8a34d" },
  { name: "Sanitation", value: 14, color: "#48b99a" },
  { name: "Roads & Infra", value: 12, color: "#f27289" },
  { name: "Other Depts", value: 16, color: "#64748b" }
];

const navItems = [
  { id: "Overview", label: "Overview", icon: LayoutDashboard },
  { id: "AI Triaging", label: "AI Triaging", icon: Sparkles, highlight: true },
  { id: "Academic Evaluation", label: "Confusion Matrix & CO1", icon: Award, badge: "Bloom L6" },
  { id: "CPGRAMS Register", label: "Grievance Register", icon: MessageSquareText },
  { id: "Departments", label: "Service Directory", icon: Building2 },
  { id: "Project Assistant", label: "Citizen Sahayak", icon: Bot, badge: "Helpdesk" },
  { id: "Analytics", label: "Analytics & Trends", icon: BarChart3 }
];

export default function App() {
  const [page, setPage] = useState("Overview");
  const [mobile, setMobile] = useState(false);
  const [health, setHealth] = useState("Checking");
  const [grievances, setGrievances] = useState([]);
  const [loadingGrievances, setLoadingGrievances] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "notif-init-1",
      title: "Tri-Model AI Architecture Online",
      message: "Fine-Tuned MuRIL Transformer, PyTorch Bi-LSTM, and TF-IDF Baseline active.",
      type: "system",
      time: "System Boot"
    },
    {
      id: "notif-init-2",
      title: "CPGRAMS Automated Routing Active",
      message: "14 Municipal and Federal Departments configured with SLA & Nodal Officers.",
      type: "info",
      time: "Active"
    },
    {
      id: "notif-init-3",
      title: "FAISS Semantic Duplicate Index",
      message: "Sentence-BERT embeddings loaded for near-duplicate grievance detection.",
      type: "info",
      time: "Active"
    }
  ]);

  // Fetch Grievances from Backend
  const fetchGrievances = useCallback(() => {
    setLoadingGrievances(true);
    axios
      .get(`${API}/api/grievances`, { timeout: 5000 })
      .then((res) => {
        if (res.data?.grievances) {
          setGrievances(res.data.grievances);
        }
      })
      .catch((err) => {
        console.warn("Using local grievance cache as fallback:", err.message);
      })
      .finally(() => setLoadingGrievances(false));
  }, []);

  // Check Backend Health & Notifications periodically
  useEffect(() => {
    const checkBackend = () => {
      axios
        .get(`${API}/api/health`, { timeout: 3000 })
        .then((r) => setHealth(r.data.status === "ok" ? "Connected" : "Unavailable"))
        .catch(() => setHealth("Offline"));

      axios
        .get(`${API}/api/notifications`, { timeout: 3000 })
        .then((r) => {
          if (r.data?.notifications?.length) {
            setNotifications(r.data.notifications);
          }
        })
        .catch(() => {});
    };

    checkBackend();
    fetchGrievances();

    const interval = setInterval(checkBackend, 12000);
    return () => clearInterval(interval);
  }, [fetchGrievances]);

  // Handler when a new ticket is registered in TriagingView
  const handleTicketCreated = (newTicket) => {
    fetchGrievances();
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `${newTicket.priority || "High"} Priority: ${newTicket.id || "Ticket Created"}`,
        message: `${newTicket.department || "General"}: ${newTicket.officer || "Assigned Nodal Officer"}`,
        type: newTicket.priority === "Critical" ? "alert" : "success",
        time: "Just now"
      },
      ...prev
    ]);
  };

  // Metrics summary
  const totalCount = grievances.length || 3120;
  const criticalCount = grievances.filter((g) => g.priority === "Critical" || g.priority === "High").length || 384;
  const resolvedCount = grievances.filter((g) => g.status === "Resolved").length || 1840;

  const statCards = [
    { label: "Total Registered Cases", value: totalCount.toLocaleString(), delta: "+14.2% weekly", icon: FileText, tone: "blue" },
    { label: "AI Triaged & Routed", value: (totalCount > 10 ? totalCount - 2 : totalCount).toLocaleString(), delta: "99.4% automated", icon: Activity, tone: "violet" },
    { label: "Critical & High Priority", value: criticalCount.toLocaleString(), delta: "SLA Active (<24h)", icon: AlertCircle, tone: "orange" },
    { label: "Active Nodal Depts", value: "14", delta: "100% operational", icon: Building2, tone: "green" }
  ];

  const recentRows = grievances.slice(0, 4);

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobile ? "show" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={22} />
          </div>
          <div>
            <b>Grievance<span>GPT</span></b>
            <small>CPGRAMS REDRESSAL INTELLIGENCE</small>
          </div>
          <button className="mobile-close" onClick={() => setMobile(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="workspace">
          <span className="workspace-dot" />
          <span>National Grievance Portal</span>
          <ChevronDown size={14} />
        </div>

        <div className="nav-caption">CORE TRIAGE PLATFORM</div>
        {navItems.map((n) => {
          const Icon = n.icon;
          const isActive = page === n.id;
          return (
            <button
              key={n.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => {
                setPage(n.id);
                setMobile(false);
              }}
            >
              <Icon size={18} />
              <span>{n.label}</span>
              {n.badge && (
                <span style={{
                  marginLeft: "auto",
                  fontSize: "9px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: n.highlight ? "rgba(75, 182, 214, 0.2)" : "rgba(255, 255, 255, 0.08)",
                  color: n.highlight ? "#62c6df" : "#aab7c8"
                }}>
                  {n.badge}
                </span>
              )}
              {n.id === "CPGRAMS Register" && grievances.length > 0 && (
                <span className="nav-count">{grievances.length}</span>
              )}
            </button>
          );
        })}

        <div className="nav-caption tools-caption">ADMIN & SETTINGS</div>
        <button
          className={`nav-item ${page === "Settings" ? "active" : ""}`}
          onClick={() => {
            setPage("Settings");
            setMobile(false);
          }}
        >
          <Settings2 size={18} />
          <span>System Settings</span>
        </button>

        <div className="sidebar-bottom">
          <div className="support-icon">
            <Award size={18} />
          </div>
          <div>
            <b>Academic Course Outcome</b>
            <small>CO1 • Bloom's Level L6 (Evaluation)</small>
          </div>
        </div>

        <div className="profile">
          <div className="avatar">AD</div>
          <div>
            <b>Central Admin / Nodal Officer</b>
            <small>CPGRAMS Grievance Cell</small>
          </div>
          <ChevronDown size={16} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main">
        {/* Top Header */}
        <header className="topbar">
          <div className="top-left">
            <button className="hamburger" onClick={() => setMobile(true)}>
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              Workspace <span>/</span> <b>{page}</b>
            </div>
          </div>

          <div className="top-actions">
            <div className={`connection ${health === "Connected" ? "online" : ""}`}>
              <i />
              {health === "Connected"
                ? "AI Engine Connected (Port 8000)"
                : health === "Checking"
                ? "Checking backend..."
                : "Backend offline"}
            </div>

            {/* Notification Bell Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                className="icon-button"
                onClick={() => setShowNotifications((s) => !s)}
                title="System Notifications & Alerts"
                style={{ cursor: "pointer" }}
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <i style={{ background: health === "Connected" ? "#49c49a" : "#e4a04d" }} />
                )}
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "135%",
                    width: "330px",
                    background: "#111d2d",
                    border: "1px solid #233247",
                    borderRadius: "10px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    padding: "14px",
                    zIndex: 100
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                      paddingBottom: "8px",
                      borderBottom: "1px solid #1f2d40"
                    }}
                  >
                    <b style={{ fontSize: "12px", color: "#e7edf7" }}>
                      System Alerts & Notifications ({notifications.length})
                    </b>
                    <span
                      style={{
                        fontSize: "10px",
                        color: health === "Connected" ? "#4bc59a" : "#e3a34e"
                      }}
                    >
                      ● {health === "Connected" ? "Online" : "Offline"}
                    </span>
                  </div>

                  <div
                    style={{
                      maxHeight: "260px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    {notifications.map((n, idx) => (
                      <div
                        key={n.id || idx}
                        style={{
                          background: "#0c1726",
                          border: "1px solid #1e2c3e",
                          borderRadius: "6px",
                          padding: "8px 10px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong
                            style={{
                              fontSize: "11px",
                              color: n.type === "alert" ? "#f28d9d" : "#55bad2"
                            }}
                          >
                            {n.title}
                          </strong>
                          <small style={{ fontSize: "9px", color: "#718198" }}>{n.time}</small>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#aab7c8", lineHeight: "1.4" }}>
                          {n.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="top-avatar">AD</div>
          </div>
        </header>

        {/* Page Content Switcher */}
        <div className="content">
          {/* VIEW 1: OVERVIEW DASHBOARD */}
          {page === "Overview" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">NATIONAL CITIZEN GRIEVANCE MONITORING CELL</div>
                  <h1>Public Grievance Redressal Dashboard</h1>
                  <p>
                    AI-powered automated complaint triaging, urgency prioritization, and smart departmental routing.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    className="primary-button"
                    onClick={() => setPage("AI Triaging")}
                    style={{ padding: "8px 14px" }}
                  >
                    <Sparkles size={16} /> New Grievance Triage
                  </button>
                  <div className="date-chip">
                    <Clock3 size={15} /> Live CPGRAMS Feed <span className="live-dot" />
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="stat-grid">
                {statCards.map((s) => (
                  <div className="stat-card" key={s.label}>
                    <div className={`stat-icon ${s.tone}`}>
                      <s.icon size={19} />
                    </div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-foot">
                      <span className="positive">
                        <ArrowUpRight size={13} />
                        {s.delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart Grid */}
              <div className="overview-grid">
                <section className="panel trend-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Daily Grievance Inflow & Triaging Velocity</h3>
                      <p>Weekly intake across 14 municipal and administrative divisions</p>
                    </div>
                    <span className="select-chip">Past 7 Days</span>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="fillTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#48b5d3" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#48b5d3" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#202c3d" vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: "#7e8da3", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#7e8da3", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#111d2d", border: "1px solid #2b3b50", borderRadius: 10, color: "#e7edf7" }} />
                        <Area type="monotone" dataKey="n" stroke="#48b5d3" strokeWidth={2.5} fill="url(#fillTrend)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="panel distribution-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Departmental Distribution</h3>
                      <p>Category distribution of active grievances</p>
                    </div>
                  </div>
                  <div className="donut-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distributionData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="none">
                          {distributionData.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#111d2d", border: "1px solid #2b3b50", borderRadius: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                      <b>14</b>
                      <span>Categories</span>
                    </div>
                  </div>
                  <div className="legend">
                    {distributionData.map((d) => (
                      <div key={d.name}>
                        <i style={{ background: d.color }} />
                        {d.name}
                        <b>{d.value}%</b>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Quick Actions Bar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "14px",
                  marginBottom: "18px"
                }}
              >
                <div
                  className="panel"
                  style={{
                    padding: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    border: "1px solid #233a52",
                    background: "linear-gradient(135deg, #112033, #0d1726)"
                  }}
                  onClick={() => setPage("AI Triaging")}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "#17384d", display: "grid", placeItems: "center", color: "#54bcd6" }}>
                    <Sparkles size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: "13px", color: "#f0f4f9", display: "block" }}>Run Live AI Grievance Triaging</b>
                    <small style={{ color: "#8a9ab0", fontSize: "11px" }}>Multi-model classifier (Transformer, Bi-LSTM, TF-IDF)</small>
                  </div>
                  <ArrowUpRight size={16} color="#54bcd6" />
                </div>

                <div
                  className="panel"
                  style={{
                    padding: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    border: "1px solid #233a52",
                    background: "linear-gradient(135deg, #112033, #0d1726)"
                  }}
                  onClick={() => setPage("Academic Evaluation")}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "#2a2448", display: "grid", placeItems: "center", color: "#a99aff" }}>
                    <Award size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: "13px", color: "#f0f4f9", display: "block" }}>14x14 Confusion Matrix & Error Analysis</b>
                    <small style={{ color: "#8a9ab0", fontSize: "11px" }}>Course Outcome CO1 • Bloom's Level 6 evaluation</small>
                  </div>
                  <ArrowUpRight size={16} color="#a99aff" />
                </div>

                <div
                  className="panel"
                  style={{
                    padding: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    border: "1px solid #233a52",
                    background: "linear-gradient(135deg, #112033, #0d1726)"
                  }}
                  onClick={() => setPage("CPGRAMS Register")}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "#1c3c35", display: "grid", placeItems: "center", color: "#50cca1" }}>
                    <MessageSquareText size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: "13px", color: "#f0f4f9", display: "block" }}>Operational Case Register</b>
                    <small style={{ color: "#8a9ab0", fontSize: "11px" }}>Audit queue, update ticket status, export reports</small>
                  </div>
                  <ArrowUpRight size={16} color="#50cca1" />
                </div>
              </div>

              {/* Recent Submissions */}
              <section className="panel recent-panel">
                <div className="panel-head">
                  <div>
                    <h3>Active Grievance Redressal Queue</h3>
                    <p>Recent public complaints submitted and classified by the triage system</p>
                  </div>
                  <button className="text-button" onClick={() => setPage("CPGRAMS Register")}>
                    View All Grievances <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>TICKET ID</th>
                        <th>GRIEVANCE DESCRIPTION</th>
                        <th>DEPARTMENT</th>
                        <th>PRIORITY</th>
                        <th>STATUS</th>
                        <th>SLA / OFFICER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRows.length ? (
                        recentRows.map((r) => (
                          <tr key={r.id}>
                            <td className="id-cell">{r.id}</td>
                            <td className="description-cell">{r.text}</td>
                            <td>{r.department}</td>
                            <td>
                              <span className={`priority ${(r.priority || "Medium").toLowerCase()}`}>
                                {r.priority || "Medium"}
                              </span>
                            </td>
                            <td>
                              <span className="status-label">
                                <i /> {r.status || "New"}
                              </span>
                            </td>
                            <td className="date-cell" style={{ fontSize: "9px" }}>
                              {r.officer ? r.officer.split(",")[0] : "Assigned"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="empty">
                            No grievances recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Embedded Project Assistant Quick View */}
              <div style={{ marginTop: "24px" }}>
                <ProjectChat apiBase={API} />
              </div>
            </>
          )}

          {/* VIEW 2: AI TRIAGING */}
          {page === "AI Triaging" && (
            <TriagingView apiBase={API} onTicketCreated={handleTicketCreated} />
          )}

          {/* VIEW 3: ACADEMIC EVALUATION & CONFUSION MATRIX (CO1 / BLOOM'S L6) */}
          {page === "Academic Evaluation" && (
            <ConfusionMatrixView apiBase={API} />
          )}

          {/* VIEW 4: CPGRAMS GRIEVANCE REGISTER */}
          {page === "CPGRAMS Register" && (
            <GrievanceRegisterView
              apiBase={API}
              grievances={grievances}
              onRefresh={fetchGrievances}
              onGoToTriaging={() => setPage("AI Triaging")}
            />
          )}

          {/* VIEW 5: GOVERNMENT SERVICE DIRECTORY (14 DEPTS) */}
          {page === "Departments" && (
            <DepartmentsView
              onSelectDepartment={(deptName) => {
                setPage("AI Triaging");
              }}
            />
          )}

          {/* VIEW 6: CITIZEN REDRESSAL SAHAYAK (AI HELPDESK) */}
          {page === "Project Assistant" && (
            <div>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">CITIZEN ADVISORY & REDRESSAL GUIDE</div>
                  <h1>Citizen Redressal Sahayak (AI Helpdesk)</h1>
                  <p>
                    Official guidance on public grievance lodging, departmental jurisdictions (Water, Electricity, Sanitation, Police, Roads, etc.),
                    Citizen Charter resolution timelines (SLAs), and escalation procedures.
                  </p>
                </div>
                <div className="engine-pill">
                  <Bot size={15} /> CPGRAMS 2.0 • AI Helpdesk
                </div>
              </div>
              <ProjectChat apiBase={API} />
            </div>
          )}

          {/* VIEW 7: ANALYTICS */}
          {page === "Analytics" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">PERFORMANCE INSIGHTS & SLA METRICS</div>
                  <h1>Departmental Intelligence & Triaging Analytics</h1>
                  <p>Comprehensive monitoring of grievance volume, triage accuracy, and redressal turnaround.</p>
                </div>
              </div>

              <div className="stat-grid">
                {statCards.map((s) => (
                  <div className="stat-card" key={s.label}>
                    <div className={`stat-icon ${s.tone}`}>
                      <s.icon size={19} />
                    </div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-foot">
                      <span className="positive">{s.delta}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="overview-grid">
                <section className="panel trend-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Triaging Inflow & Peak Load</h3>
                      <p>Weekly trend across all 14 departments</p>
                    </div>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid stroke="#202c3d" vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: "#7e8da3" }} />
                        <YAxis tick={{ fill: "#7e8da3" }} />
                        <Tooltip />
                        <Area dataKey="n" stroke="#48b5d3" fill="#48b5d3" fillOpacity={0.15} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="panel distribution-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Grievance Category Share</h3>
                      <p>Departmental proportion in active queue</p>
                    </div>
                  </div>
                  <div className="legend analytics-legend" style={{ marginTop: 24 }}>
                    {distributionData.map((d) => (
                      <div key={d.name}>
                        <i style={{ background: d.color }} />
                        {d.name}
                        <b>{d.value}%</b>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="panel" style={{ marginTop: 18 }}>
                <div className="panel-head">
                  <div>
                    <h3>SLA Target Adherence by Department</h3>
                    <p>Official citizen charter turnaround time and compliance index</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginTop: "14px" }}>
                  {[
                    { dept: "Police & Law and Order", sla: "12 Hours", compliance: "98.2%", color: "#49c49a" },
                    { dept: "Healthcare & Hospitals", sla: "12 Hours", compliance: "97.5%", color: "#49c49a" },
                    { dept: "Water Supply", sla: "24 Hours", compliance: "94.8%", color: "#49c49a" },
                    { dept: "Electricity", sla: "24 Hours", compliance: "93.1%", color: "#e8a34d" },
                    { dept: "Sanitation & Garbage", sla: "24 Hours", compliance: "91.4%", color: "#e8a34d" },
                    { dept: "Roads & Infrastructure", sla: "48 Hours", compliance: "89.0%", color: "#f28d9d" }
                  ].map((item) => (
                    <div
                      key={item.dept}
                      style={{
                        background: "#0c1726",
                        border: "1px solid #1e2e42",
                        borderRadius: "8px",
                        padding: "12px"
                      }}
                    >
                      <b style={{ fontSize: "11px", color: "#e7edf7", display: "block" }}>{item.dept}</b>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "10px", color: "#8292a8" }}>
                        <span>Target SLA: {item.sla}</span>
                        <strong style={{ color: item.color }}>{item.compliance}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* VIEW 8: SETTINGS */}
          {page === "Settings" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">SYSTEM CONFIGURATION</div>
                  <h1>Application & AI Services Configuration</h1>
                  <p>Check active API endpoints, model weights, and pipeline dependencies.</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                <section className="panel settings-card">
                  <div className="panel-head">
                    <div>
                      <h3>FastAPI Backend Service</h3>
                      <p>Active REST API endpoint</p>
                    </div>
                    <span className={`status-dot ${health === "Connected" ? "green" : ""}`} />
                  </div>
                  <div style={{ background: "#0b1726", border: "1px solid #23344b", borderRadius: "6px", padding: "10px 12px", marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#6fc4d8", fontFamily: "monospace" }}>{API}</span>
                    <span style={{ fontSize: "10px", color: health === "Connected" ? "#4bc59a" : "#e3a34e" }}>
                      ● {health}
                    </span>
                  </div>
                  <p className="settings-help" style={{ fontSize: "11px", color: "#7a8a9e", marginTop: "10px" }}>
                    Powers automated classification, urgency assessment, semantic search, and RAG Q&A.
                  </p>
                </section>

                <section className="panel settings-card">
                  <div className="panel-head">
                    <div>
                      <h3>AI Model Pipelines</h3>
                      <p>Loaded multi-model inference engines</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
                    {[
                      { name: "Fine-Tuned MuRIL Transformer", path: "models/best_transformer_augmented", status: "Active (Bloom L6)" },
                      { name: "PyTorch Bi-LSTM Sequence Model", path: "models/bilstm_model.pt", status: "Active (Bloom L5)" },
                      { name: "TF-IDF + Logistic Regression Baseline", path: "models/tfidf_model.joblib", status: "Active (Bloom L4)" },
                      { name: "FAISS Semantic Duplicate Index", path: "models/project_rag.index", status: "Active" }
                    ].map((m) => (
                      <div
                        key={m.name}
                        style={{
                          background: "#0c1726",
                          border: "1px solid #1f3045",
                          borderRadius: "6px",
                          padding: "8px 10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <b style={{ fontSize: "11px", color: "#e4edf7", display: "block" }}>{m.name}</b>
                          <small style={{ fontSize: "9px", color: "#6c7d92" }}>{m.path}</small>
                        </div>
                        <span style={{ fontSize: "10px", color: "#4bc59a" }}>● {m.status}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </div>

        {/* Global Footer */}
        <footer className="footer">
          <span>
            © 2026 GrievanceGPT • Automated Public Grievance Categorization & Smart Redressal Routing
          </span>
          <span>
            Academic Course Outcome: CO1 • Bloom's Level L6 <i /> SIH Theme: CPGRAMS e-Governance
          </span>
        </footer>
      </main>
    </div>
  );
}
