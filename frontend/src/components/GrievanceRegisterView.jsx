import React, { useState } from "react";
import axios from "axios";
import {
  Search, Filter, Download, ArrowUpRight, CheckCircle2,
  AlertTriangle, Clock, RefreshCw, ChevronDown, Check, ShieldAlert
} from "lucide-react";

export default function GrievanceRegisterView({ apiBase, grievances, onRefresh, onGoToTriaging }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);

  const departments = [
    "All",
    "Water Supply",
    "Police & Law and Order",
    "Electricity",
    "Sanitation & Garbage",
    "Roads & Infrastructure",
    "Healthcare & Hospitals",
    "Education & Schools",
    "Corruption & Bribery",
    "Employment & Labour",
    "Banking & Financial Services",
    "Land Records & Revenue",
    "Pension & Provident Fund",
    "Ration & Public Distribution System",
    "Municipal Certificates"
  ];

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await axios.patch(`${apiBase}/api/grievances/${id}`, { status: newStatus });
      if (onRefresh) onRefresh();
    } catch (e) {
      alert("Error updating status: " + (e.response?.data?.detail || e.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = grievances.filter((g) => {
    const textMatch =
      (g.text || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.department || "").toLowerCase().includes(searchTerm.toLowerCase());

    const deptMatch = deptFilter === "All" || g.department === deptFilter;
    const priorityMatch = priorityFilter === "All" || (g.priority || "").toLowerCase() === priorityFilter.toLowerCase();
    const statusMatch = statusFilter === "All" || (g.status || "").toLowerCase() === statusFilter.toLowerCase();

    return textMatch && deptMatch && priorityMatch && statusMatch;
  });

  const exportCSV = () => {
    const headers = ["Ticket ID", "Department", "Priority", "Urgency Score", "Status", "Nodal Officer", "SLA Deadline", "Received Date", "Grievance Narrative"];
    const rows = filtered.map((g) => [
      `"${g.id || ""}"`,
      `"${g.department || ""}"`,
      `"${g.priority || ""}"`,
      `"${g.urgency_score || ""}"`,
      `"${g.status || ""}"`,
      `"${g.officer || ""}"`,
      `"${g.sla_deadline || ""}"`,
      `"${g.date || ""}"`,
      `"${(g.text || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CPGRAMS_Grievances_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const criticalCount = grievances.filter((g) => g.priority === "Critical").length;
  const inProgressCount = grievances.filter((g) => g.status === "In progress" || g.status === "Assigned").length;
  const resolvedCount = grievances.filter((g) => g.status === "Resolved").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page Heading */}
      <div className="page-heading" style={{ marginBottom: 0 }}>
        <div>
          <div className="eyebrow">CENTRALIZED MONITORING CELL</div>
          <h1>Public Grievance Registry & Operational Queue</h1>
          <p>
            Review automated department routing, SLA deadlines, and update grievance redressal lifecycle.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={exportCSV}
            style={{
              background: "#142236",
              border: "1px solid #243852",
              color: "#9db3cb",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <Download size={15} /> Export Queue CSV
          </button>
          <button className="primary-button" onClick={onGoToTriaging}>
            + Triage New Complaint
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <div className="stat-card" style={{ minHeight: "auto", padding: "14px 18px" }}>
          <small style={{ color: "#778ba0", fontSize: "10px", fontWeight: 700 }}>TOTAL REGISTERED</small>
          <div style={{ fontSize: "22px", fontWeight: 800, marginTop: 4, color: "#eef4fb" }}>{grievances.length}</div>
          <small style={{ color: "#54bfd6", fontSize: "10px" }}>Live queue tickets</small>
        </div>
        <div className="stat-card" style={{ minHeight: "auto", padding: "14px 18px" }}>
          <small style={{ color: "#778ba0", fontSize: "10px", fontWeight: 700 }}>CRITICAL / URGENT</small>
          <div style={{ fontSize: "22px", fontWeight: 800, marginTop: 4, color: "#f28d9d" }}>{criticalCount}</div>
          <small style={{ color: "#ffb3bd", fontSize: "10px" }}>Requires &lt;12h SLA response</small>
        </div>
        <div className="stat-card" style={{ minHeight: "auto", padding: "14px 18px" }}>
          <small style={{ color: "#778ba0", fontSize: "10px", fontWeight: 700 }}>ACTIVE INVESTIGATION</small>
          <div style={{ fontSize: "22px", fontWeight: 800, marginTop: 4, color: "#f0b36d" }}>{inProgressCount}</div>
          <small style={{ color: "#e3a34e", fontSize: "10px" }}>Assigned to nodal teams</small>
        </div>
        <div className="stat-card" style={{ minHeight: "auto", padding: "14px 18px" }}>
          <small style={{ color: "#778ba0", fontSize: "10px", fontWeight: 700 }}>RESOLVED REDRESSALS</small>
          <div style={{ fontSize: "22px", fontWeight: 800, marginTop: 4, color: "#48c9a3" }}>{resolvedCount}</div>
          <small style={{ color: "#49cb9f", fontSize: "10px" }}>Closed with citizen note</small>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="panel"
        style={{
          padding: "14px 18px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: "260px" }}>
          <div className="search-box" style={{ width: "100%", maxWidth: "340px" }}>
            <Search size={16} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by keyword, ticket ID, or department..."
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Department Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11px", color: "#8092a7" }}>
            <span>Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                background: "#0c1726",
                border: "1px solid #24354c",
                borderRadius: 6,
                color: "#dbe5f2",
                padding: "6px 10px",
                fontSize: "11px",
                outline: "none"
              }}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11px", color: "#8092a7" }}>
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                background: "#0c1726",
                border: "1px solid #24354c",
                borderRadius: 6,
                color: "#dbe5f2",
                padding: "6px 10px",
                fontSize: "11px",
                outline: "none"
              }}
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11px", color: "#8092a7" }}>
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: "#0c1726",
                border: "1px solid #24354c",
                borderRadius: 6,
                color: "#dbe5f2",
                padding: "6px 10px",
                fontSize: "11px",
                outline: "none"
              }}
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Assigned">Assigned</option>
              <option value="In progress">In progress</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh queue"
              style={{
                background: "#0c1726",
                border: "1px solid #24354c",
                borderRadius: 6,
                color: "#9ab0c8",
                padding: "7px 10px",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <section className="panel" style={{ padding: 18 }}>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>TICKET ID</th>
                <th>COMPLAINT NARRATIVE</th>
                <th>ROUTED DEPARTMENT</th>
                <th>URGENCY</th>
                <th>SLA STATUS</th>
                <th>STATUS ACTION</th>
                <th>RECEIVED</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((r, i) => (
                  <tr key={r.id || i}>
                    <td className="id-cell">{r.id}</td>
                    <td className="description-cell" style={{ maxWidth: 280 }}>
                      <div>{r.text}</div>
                      {r.officer && (
                        <small style={{ color: "#6e829a", fontSize: "9px", display: "block", marginTop: 3 }}>
                          Officer: {r.officer}
                        </small>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#dbe5f2", fontSize: "11px" }}>{r.department}</span>
                    </td>
                    <td>
                      <span className={`priority ${(r.priority || "Medium").toLowerCase()}`}>{r.priority}</span>
                      {r.urgency_score !== undefined && (
                        <small style={{ display: "block", color: "#74869e", fontSize: "9px", marginTop: 2 }}>
                          Score: {r.urgency_score}/100
                        </small>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "10px", color: r.priority === "Critical" ? "#f28d9d" : "#50c6a1" }}>
                        <Clock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                        {r.sla_deadline || "48h SLA"}
                      </span>
                    </td>
                    <td>
                      {/* Interactive Status Switcher */}
                      <select
                        value={r.status || "New"}
                        disabled={updatingId === r.id}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        style={{
                          background: "#0c1726",
                          border: "1px solid #273a50",
                          color:
                            r.status === "Resolved"
                              ? "#49cb9f"
                              : r.status === "Escalated"
                              ? "#f28d9d"
                              : r.status === "In progress"
                              ? "#f0b36d"
                              : "#9ab0c8",
                          borderRadius: 6,
                          padding: "5px 8px",
                          fontSize: "10px",
                          fontWeight: 600,
                          outline: "none",
                          cursor: "pointer"
                        }}
                      >
                        <option value="New">New</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In progress">In progress</option>
                        <option value="Escalated">Escalated</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="date-cell">{r.date || "Today"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty">
                    No matching grievances found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

