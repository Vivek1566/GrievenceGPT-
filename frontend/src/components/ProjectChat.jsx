import React, { useState } from "react";
import axios from "axios";
import { MessageSquare, Send, Sparkles, Bot, User, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

export default function ProjectChat({ apiBase }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Namaste! I am your CPGRAMS Citizen Redressal Sahayak. How can I assist you with public grievance redressal today? You can ask about departmental jurisdictions, resolution deadlines (SLAs), how to draft an effective complaint, or escalation procedures for delayed cases.",
      sources: []
    }
  ]);
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    "How do I escalate an unresolved complaint if SLA deadline is exceeded?",
    "What are the official resolution timelines (SLAs) for water & electricity?",
    "What essential details should I include when filing a public grievance?",
    "Which matters cannot be entertained under CPGRAMS guidelines?",
    "Which department handles broken sewer lines and overflowing garbage?"
  ];

  const handleSend = async (qText) => {
    const query = (qText || question).trim();
    if (!query) return;

    const userMsg = { role: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await axios.post(`${apiBase}/api/chat`, { question: query });
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: res.data.answer,
          sources: res.data.sources || []
        }
      ]);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errMsg =
        typeof detail === "string"
          ? detail
          : "Error communicating with AI assistant. Ensure the backend server is running.";
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: errMsg,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ padding: 24, borderRadius: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid #1c2b3e", paddingBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #38b6d4, #277799)", display: "grid", placeItems: "center", color: "white" }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", color: "#f0f5fa" }}>Citizen Redressal Sahayak (AI Helpdesk)</h3>
            <small style={{ color: "#74869e", fontSize: "11px" }}>CPGRAMS Citizen Charter & Public Service Delivery Guide</small>
          </div>
        </div>
        <span style={{ fontSize: "10px", color: "#4ec2dd", background: "#152d3c", padding: "4px 8px", borderRadius: 6, fontWeight: 700 }}>
          <Sparkles size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
          CPGRAMS 2.0 • AI Helpdesk
        </span>
      </div>

      {/* Suggested Questions */}
      <div style={{ marginBottom: 16 }}>
        <small style={{ color: "#71839a", fontSize: "10px", fontWeight: 700, display: "block", marginBottom: 6 }}>
          CITIZEN GUIDANCE INQUIRIES:
        </small>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              disabled={loading}
              style={{
                background: "#0c1726",
                border: "1px solid #23344a",
                color: "#9db0c6",
                borderRadius: 6,
                padding: "6px 10px",
                fontSize: "11px",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div
        style={{
          maxHeight: "340px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "12px",
          background: "#0a1320",
          borderRadius: 8,
          border: "1px solid #1c2b3e",
          marginBottom: 16
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%"
            }}
          >
            {m.role === "bot" && (
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1c3c52", display: "grid", placeItems: "center", color: "#54bfd6", flexShrink: 0, marginTop: 2 }}>
                <Bot size={14} />
              </div>
            )}
            <div
              style={{
                background: m.role === "user" ? "#1a364d" : m.isError ? "#3d1f27" : "#111d2e",
                border: m.role === "user" ? "1px solid #285579" : m.isError ? "1px solid #6b2a36" : "1px solid #1d2d42",
                color: m.isError ? "#ffb3bd" : "#e6effa",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: "12px",
                lineHeight: "1.6"
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "11px", marginBottom: 3, color: m.role === "user" ? "#61c7df" : "#49cb9f" }}>
                {m.role === "user" ? "Citizen" : "CPGRAMS Sahayak"}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>

              {m.sources && m.sources.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #1c2b3e" }}>
                  <small style={{ color: "#718399", fontSize: "10px", fontWeight: 700 }}>CITIZEN CHARTER & JURISDICTION GUIDELINES:</small>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 16, color: "#92a6bd", fontSize: "10px" }}>
                    {m.sources.map((s, idx) => (
                      <li key={idx} style={{ marginTop: 2 }}>{s.slice(0, 120)}...</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {m.role === "user" && (
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#254863", display: "grid", placeItems: "center", color: "#8ec8e4", flexShrink: 0, marginTop: 2 }}>
                <User size={14} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#7ea3bf", fontSize: "11px", padding: 8 }}>
            <span className="spinner" style={{ width: 14, height: 14 }} />
            <span>Consulting citizen charter & redressal guidelines...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: "flex", gap: 10 }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about department jurisdictions, SLAs, escalation, or how to file a complaint..."
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "#0c1726",
            border: "1px solid #23374e",
            borderRadius: 8,
            color: "#e2ecf7",
            fontSize: "12px",
            outline: "none"
          }}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          style={{
            background: "linear-gradient(105deg, #2799b7, #247a97)",
            border: "none",
            color: "white",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "11px",
            cursor: loading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <span>Ask</span> <Send size={13} />
        </button>
      </form>
    </div>
  );
}
