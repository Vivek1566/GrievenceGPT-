import React, { useState } from "react";
import axios from "axios";
import {
  Sparkles, Send, AlertCircle, CheckCircle2, ShieldCheck,
  Gauge, Zap, Clock, Building2, Layers, Cpu, Search, Check,
  UserCheck, AlertTriangle, ArrowRight, FileText
} from "lucide-react";

export default function TriagingView({ apiBase, onTicketCreated }) {
  const [complaint, setComplaint] = useState(
    "There is no drinking water available in our locality for the past five days. Over 200 families and children are suffering. Please resolve this urgently."
  );
  const [selectedModel, setSelectedModel] = useState("transformer");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [citizenName, setCitizenName] = useState("");
  const [district, setDistrict] = useState("North-West Municipal District");

  const runAnalysis = async () => {
    const text = complaint.trim();
    if (!text) {
      setError("Please describe the grievance before analyzing.");
      return;
    }

    setLoading(true);
    setError("");
    setRegisteredSuccess(false);

    try {
      const res = await axios.post(`${apiBase}/api/analyze`, {
        complaint: text,
        model: selectedModel
      });
      setResult(res.data);
    } catch (e) {
      let msg = "Could not connect to the AI backend. Make sure the FastAPI server is running.";
      const detail = e.response?.data?.detail;
      if (typeof detail === "string") {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || d.message || "Validation error").join(". ");
      } else if (detail && typeof detail === "object") {
        msg = detail.msg || detail.message || "Unable to process the grievance text.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTicket = async () => {
    if (!result) return;
    try {
      const res = await axios.post(`${apiBase}/api/grievances`, {
        text: complaint.trim(),
        citizen_name: citizenName || "Citizen Applicant",
        district: district,
        model: selectedModel
      });
      setRegisteredSuccess(true);
      if (onTicketCreated) {
        onTicketCreated(res.data.grievance);
      }
    } catch (e) {
      alert("Error filing grievance ticket: " + (e.response?.data?.detail || e.message));
    }
  };

  const sampleComplaints = [
    {
      label: "Water Crisis",
      text: "There is no drinking water available in our locality for the past five days. Over 200 families and children are suffering. Please resolve this urgently."
    },
    {
      label: "Police FIR Delay",
      text: "I submitted my missing child report at the police station 10 days ago, but no search investigation or FIR has been registered yet."
    },
    {
      label: "Vigilance / Bribe",
      text: "Revenue clerk at the tehsil office is demanding 10,000 rupees bribe to release my legal land mutation papers."
    },
    {
      label: "Road Damage",
      text: "Main road connecting Sector 12 to the district hospital is riddled with huge potholes causing accidents daily."
    },
    {
      label: "Power Grid Failure",
      text: "Transformer blast in our colony caused total blackout for 48 hours. Patients on oxygen support are in danger."
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="page-heading" style={{ marginBottom: 0 }}>
        <div>
          <div className="eyebrow">INTELLIGENT CITIZEN TRIAGING (CPGRAMS 2.0)</div>
          <h1>Public Grievance Categorization & Urgency Routing</h1>
          <p>
            Submit grievances in English, Hindi, or Hinglish. Evaluated across baseline, sequence, and transformer architectures.
          </p>
        </div>
        <div className="engine-pill" style={{ background: "#132338", borderColor: "#203a58", color: "#61c7df" }}>
          <Sparkles size={15} /> Active Engine: {selectedModel.toUpperCase()}
        </div>
      </div>

      {/* Model Selection Bar */}
      <div
        style={{
          background: "#0e1828",
          border: "1px solid #1e2e42",
          borderRadius: 12,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#778aa0", letterSpacing: "1px" }}>
          SELECT CLASSIFIER:
        </span>
        {[
          { id: "transformer", name: "MuRIL Transformer", tag: "SOTA (L6)" },
          { id: "bilstm", name: "Bi-LSTM Sequence", tag: "Recurrent (L5)" },
          { id: "tfidf", name: "TF-IDF + LogReg", tag: "Baseline (L4)" },
          { id: "all", name: "⚡ Ensemble (Compare All 3)", tag: "Multi-Model" }
        ].map((m) => {
          const active = selectedModel === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              style={{
                background: active ? "linear-gradient(105deg, #1f4560, #1b3d56)" : "transparent",
                border: active ? "1px solid #3eb4d4" : "1px solid #24354b",
                color: active ? "#63c7df" : "#8ea1b8",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: "11px",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease"
              }}
            >
              <span>{m.name}</span>
              <span
                style={{
                  fontSize: "9px",
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: active ? "#142c3d" : "#172332",
                  color: active ? "#50c6a1" : "#6c8096"
                }}
              >
                {m.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Input Grid */}
      <div className="inspection-layout">
        {/* Left: Input Form */}
        <section className="panel input-panel">
          <div className="section-title">
            <div className="step-number">01</div>
            <div>
              <h3>Citizen Grievance Description</h3>
              <p>State the issue clearly. Multilingual dialect is supported.</p>
            </div>
          </div>

          <label className="field-label">GRIEVANCE STATEMENT (COMPLAINT NARRATIVE)</label>
          <textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Type or paste the public complaint here..."
            maxLength={5000}
            style={{ height: "160px" }}
          />

          <div className="textarea-foot">
            <span>Include location, duration, and people affected for precise urgency scoring.</span>
            <b>{complaint.length}/5000 chars</b>
          </div>

          {/* Quick Examples */}
          <div className="sample-row" style={{ margin: "14px 0" }}>
            <span>Try sample complaints:</span>
            {sampleComplaints.map((s, idx) => (
              <button key={idx} onClick={() => setComplaint(s.text)}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Optional Citizen Metadata */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label className="field-label">CITIZEN NAME (OPTIONAL)</label>
              <input
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "#0c1726",
                  border: "1px solid #23344a",
                  borderRadius: 6,
                  color: "#dbe5f2",
                  fontSize: "11px",
                  marginTop: 6
                }}
              />
            </div>
            <div>
              <label className="field-label">DISTRICT JURISDICTION</label>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Central Municipal District"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "#0c1726",
                  border: "1px solid #23344a",
                  borderRadius: 6,
                  color: "#dbe5f2",
                  fontSize: "11px",
                  marginTop: 6
                }}
              />
            </div>
          </div>

          <button
            className="primary-button analyze-button"
            onClick={runAnalysis}
            disabled={loading || !complaint.trim()}
          >
            {loading ? (
              <>
                <span className="spinner" /> Analyzing grievance through AI pipeline...
              </>
            ) : (
              <>
                <Sparkles size={17} /> Triage Grievance with {selectedModel.toUpperCase()} <Send size={15} />
              </>
            )}
          </button>

          {error && (
            <div className="error-box">
              <AlertCircle size={17} /> {error}
            </div>
          )}
        </section>

        {/* Right: Pipeline Visualizer */}
        <section className="panel pipeline-panel">
          <div className="panel-head">
            <div>
              <h3>AI Triaging Pipeline</h3>
              <p>4 Autonomous Processing Stages</p>
            </div>
            <span className="pipeline-live">
              <i /> ONLINE
            </span>
          </div>

          {[
            {
              icon: Building2,
              title: "1. Department Categorization",
              desc: `${selectedModel === "tfidf" ? "TF-IDF N-Gram Baseline" : selectedModel === "bilstm" ? "Bi-LSTM Sequence RNN" : "MuRIL Transformer Attention"} (14 Categories)`
            },
            {
              icon: Gauge,
              title: "2. Urgency & Sentiment Scoring",
              desc: "VADER Polarity + Emergency/Group/Duration Heuristic Rules"
            },
            {
              icon: Clock,
              title: "3. Auto-Routing & SLA Assignment",
              desc: "Tier-1 / Tier-2 Nodal Officer Dispatch with Deadlines"
            },
            {
              icon: Search,
              title: "4. Semantic Similarity Deduplication",
              desc: "Sentence-BERT Embeddings across Historical Corpus"
            }
          ].map((x, i) => (
            <div className="pipeline-step" key={i}>
              <div className="pipeline-icon">
                <x.icon size={17} />
              </div>
              <div>
                <b>{x.title}</b>
                <small>{x.desc}</small>
              </div>
              <CheckCircle2 size={16} className="check-muted" />
            </div>
          ))}

          <div className="privacy-note">
            <ShieldCheck size={16} /> All complaint narratives are processed locally with zero external data sharing.
          </div>
        </section>
      </div>

      {/* Analysis Results Display */}
      {result && (
        <section className="panel results-panel" style={{ padding: 24 }}>
          <div className="panel-head" style={{ marginBottom: 18 }}>
            <div>
              <div className="eyebrow">TRIAGING COMPLETED</div>
              <h3 style={{ fontSize: "18px" }}>AI Triage Assessment & Dispatch Recommendation</h3>
              <small style={{ color: "#7a8ea3" }}>
                Classified via {result.model_used} in {result.pipeline_latency_ms} ms
              </small>
            </div>
            <span className="success-tag">
              <CheckCircle2 size={14} /> Triage Verified
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div className="result-grid">
            {/* Predicted Department */}
            <div className="result-primary">
              <span className="result-label">PREDICTED DEPARTMENT</span>
              <h2 style={{ color: "#54bfd6", fontSize: "21px" }}>{result.predicted_department}</h2>
              <div className="confidence-track">
                <i style={{ width: `${Math.min(100, result.classification_confidence)}%` }} />
              </div>
              <small>{result.classification_confidence}% model confidence</small>
            </div>

            {/* Urgency Score & Priority */}
            <div className="result-metric">
              <span>URGENCY PRIORITY</span>
              <b
                className={`priority ${String(result.priority).toLowerCase()}`}
                style={{ fontSize: "14px", padding: "6px 10px", marginTop: 8 }}
              >
                {result.priority} Priority
              </b>
              <small>Urgency Index: {result.urgency_score} / 100</small>
            </div>

            {/* Sentiment & Latency */}
            <div className="result-metric">
              <span>SENTIMENT POLARITY</span>
              <b style={{ color: result.sentiment < -0.1 ? "#f28d9d" : "#50c6a1" }}>
                {result.sentiment_label} ({result.sentiment})
              </b>
              <small>Execution time: {result.pipeline_latency_ms}ms</small>
            </div>
          </div>

          {/* Multi-Model Comparison Card (if Ensemble was selected) */}
          {result.multi_model_comparison && (
            <div
              style={{
                marginTop: 20,
                background: "#0c1726",
                border: "1px solid #1f334a",
                borderRadius: 10,
                padding: "16px 20px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <b style={{ fontSize: "13px", color: "#61c7df" }}>
                  Multi-Model Comparison (Academic Ensemble)
                </b>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 5,
                    background: result.multi_model_comparison.consensus ? "#11382b" : "#452818",
                    color: result.multi_model_comparison.consensus ? "#4bc59a" : "#f0b36d"
                  }}
                >
                  {result.multi_model_comparison.consensus ? "✓ Full Model Consensus" : "⚠ Models Disagree"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {Object.entries(result.multi_model_comparison.models).map(([key, m]) => (
                  <div
                    key={key}
                    style={{
                      background: "#122033",
                      border: "1px solid #1f3045",
                      borderRadius: 8,
                      padding: "10px 14px"
                    }}
                  >
                    <small style={{ color: "#778ba0", textTransform: "uppercase", fontSize: "9px" }}>
                      {m.model_used}
                    </small>
                    <div style={{ fontWeight: 700, color: "#e4edf7", fontSize: "13px", marginTop: 4 }}>
                      {m.department}
                    </div>
                    <div style={{ fontSize: "11px", color: "#48b5d3", marginTop: 4 }}>
                      {m.confidence}% conf ({m.latency_ms}ms)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 3 Predictions & Keyword Triggers */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginTop: 20 }}>
            <div>
              <h4 className="subhead" style={{ margin: "0 0 10px" }}>Top Department Confidence Distribution</h4>
              <div className="prediction-list">
                {(result.top_predictions || []).map((p, i) => (
                  <div className="prediction" key={i}>
                    <span>{i + 1}</span>
                    <b>{p.department}</b>
                    <div className="mini-track">
                      <i style={{ width: `${p.confidence}%` }} />
                    </div>
                    <strong>{p.confidence}%</strong>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="subhead" style={{ margin: "0 0 10px" }}>Urgency Triggers & Detected Cues</h4>
              <div style={{ background: "#0c1726", border: "1px solid #1e2e42", borderRadius: 8, padding: 14 }}>
                <small style={{ color: "#74869e", display: "block", marginBottom: 8 }}>
                  HEURISTIC KEYWORD MATCHES
                </small>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {result.detected_keywords && result.detected_keywords.length > 0 ? (
                    result.detected_keywords.map((k, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#26364b",
                          color: "#9fc2db",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: "11px",
                          fontWeight: 600
                        }}
                      >
                        {k}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#66778a", fontSize: "11px" }}>No acute emergency triggers detected.</span>
                  )}
                </div>

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #1a283a", fontSize: "11px", color: "#8ca0b6" }}>
                  <div>
                    <b>Sentiment Impact:</b> {result.sentiment < -0.2 ? "High citizen frustration" : "Moderate tone"}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <b>Priority Formula:</b> Urgency Score = Keyword Weights + VADER Negative Polarity Offset
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Government Routing Section */}
          <div
            style={{
              marginTop: 20,
              background: "linear-gradient(135deg, #102436, #0e1e2d)",
              border: "1px solid #234861",
              borderRadius: 10,
              padding: "16px 20px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: "#1c4a63", display: "grid", placeItems: "center", color: "#65ccdf" }}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <small style={{ color: "#7296aa", fontSize: "10px", letterSpacing: "1px", fontWeight: 700 }}>
                    AUTOMATED NODAL DISPATCH ROUTE
                  </small>
                  <h4 style={{ margin: "2px 0 0", fontSize: "14px", color: "#e8f4fa" }}>
                    {result.routing_info?.assigned_nodal_officer}
                  </h4>
                </div>
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <small style={{ color: "#7296aa", fontSize: "10px" }}>SLA DEADLINE</small>
                  <div style={{ color: "#54d3ab", fontWeight: 700, fontSize: "13px" }}>
                    Within {result.routing_info?.sla_hours} Hours
                  </div>
                </div>
                <div>
                  <small style={{ color: "#7296aa", fontSize: "10px" }}>ESCALATION TIER</small>
                  <div style={{ color: "#f0b36d", fontWeight: 700, fontSize: "13px" }}>
                    {result.routing_info?.escalation_tier}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1c364b", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8ab4c9", fontSize: "11px" }}>
                <Zap size={15} color="#54bfd6" />
                <b>Action Recommendation:</b> {result.recommended_action}
              </div>

              {/* Register Ticket Action */}
              <button
                onClick={handleRegisterTicket}
                disabled={registeredSuccess}
                style={{
                  background: registeredSuccess ? "#1a4639" : "linear-gradient(105deg, #289ab7, #247a97)",
                  border: registeredSuccess ? "1px solid #338a71" : "none",
                  color: "white",
                  padding: "9px 16px",
                  borderRadius: 7,
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: registeredSuccess ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(36,122,151,0.3)"
                }}
              >
                {registeredSuccess ? (
                  <>
                    <Check size={15} /> Filed in CPGRAMS Register!
                  </>
                ) : (
                  <>
                    <FileText size={15} /> Register & File Grievance Ticket
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Semantic Duplicate / Similarity Matches */}
          {result.similar_complaints?.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <h4 className="subhead" style={{ margin: "0 0 10px" }}>
                Historical Similarity Search (Sentence-BERT Deduplication)
              </h4>
              <div className="similar-list">
                {result.similar_complaints.map((s, idx) => (
                  <div key={idx}>
                    <div>
                      <b>{s.grievance_id || `GRV-MATCH-${idx + 1}`}</b>
                      <span>{s.category}</span>
                    </div>
                    <p>{s.text}</p>
                    <strong style={{ color: "#49cb9f" }}>{s.similarity}% match</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
