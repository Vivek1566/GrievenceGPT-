import json
import time
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.services.classifier import load_classifier
from app.services.urgency import calculate_urgency, recommend_action
from app.services.similarity import find_similar
from app.services.rag_qa import ProjectRAGService
from app.services.multi_model_service import predict_any, compare_all_models, get_benchmarks_data

ROOT = Path(__file__).resolve().parents[3]
STORE_FILE = ROOT / "data" / "grievances_store.json"

ROUTING_DIRECTORY = {
    "Water Supply": {"officer": "Chief Engineer, Delhi Jal Board / Municipal Jal Sansthan", "sla_hours": 24, "portal": "jaljeevan.gov.in"},
    "Police & Law and Order": {"officer": "Superintendent of Police (Law & Grievance Cell)", "sla_hours": 12, "portal": "cctns.gov.in"},
    "Electricity": {"officer": "Executive Engineer, State DISCOM / Power Transmission", "sla_hours": 24, "portal": "urjavaran.gov.in"},
    "Sanitation & Garbage": {"officer": "Chief Municipal Health Officer, Swachh Bharat Cell", "sla_hours": 24, "portal": "swachhbharat.gov.in"},
    "Roads & Infrastructure": {"officer": "Superintending Engineer, PWD / NHAI Division", "sla_hours": 48, "portal": "morth.nic.in"},
    "Healthcare & Hospitals": {"officer": "Chief Medical Officer (CMO), Health Directorate", "sla_hours": 12, "portal": "mohfw.gov.in"},
    "Education & Schools": {"officer": "District Education Officer (DEO), Samagra Shiksha", "sla_hours": 72, "portal": "samagra.education.gov.in"},
    "Corruption & Bribery": {"officer": "Special Director, Anti-Corruption Bureau / Lokayukta", "sla_hours": 24, "portal": "cpcb.gov.in"},
    "Employment & Labour": {"officer": "Labour Commissioner, Shram Suvidha Portal", "sla_hours": 72, "portal": "shramsuvidha.gov.in"},
    "Banking & Financial Services": {"officer": "Banking Ombudsman, RBI Financial Inclusion Wing", "sla_hours": 48, "portal": "rbi.org.in"},
    "Land Records & Revenue": {"officer": "Sub-Divisional Magistrate (SDM Revenue / Tehsildar)", "sla_hours": 96, "portal": "dlrc.gov.in"},
    "Pension & Provident Fund": {"officer": "Regional Provident Fund Commissioner, EPFO", "sla_hours": 48, "portal": "epfindia.gov.in"},
    "Ration & Public Distribution System": {"officer": "District Supply Officer, National Food Security Mission", "sla_hours": 36, "portal": "nfsa.gov.in"},
    "Municipal Certificates": {"officer": "Municipal Registrar of Births, Deaths & Trade Licenses", "sla_hours": 48, "portal": "edistrict.gov.in"}
}

# --- Default Grievance Store Initializer ---
_INITIAL_GRIEVANCES = [
    {
        "id": "GRV-2401",
        "text": "No drinking water has been supplied in our locality for the last four days. Over 200 families suffering.",
        "department": "Water Supply",
        "priority": "High",
        "urgency_score": 75,
        "status": "In progress",
        "officer": "Chief Engineer, Delhi Jal Board / Municipal Jal Sansthan",
        "sla_deadline": "24h (SLA Active)",
        "date": "Today, 10:42 AM",
        "model_used": "Fine-Tuned MuRIL Transformer"
    },
    {
        "id": "GRV-2402",
        "text": "Street lights are not working near the main highway crossroad, creating severe crime and safety concerns at night.",
        "department": "Electricity",
        "priority": "Medium",
        "urgency_score": 45,
        "status": "Assigned",
        "officer": "Executive Engineer, State DISCOM / Power Transmission",
        "sla_deadline": "48h (SLA Active)",
        "date": "Today, 09:18 AM",
        "model_used": "Fine-Tuned MuRIL Transformer"
    },
    {
        "id": "GRV-2403",
        "text": "I reported a missing person at the local chowki 15 days ago, but no search FIR or investigation has started yet.",
        "department": "Police & Law and Order",
        "priority": "Critical",
        "urgency_score": 90,
        "status": "Escalated",
        "officer": "Superintendent of Police (Law & Grievance Cell)",
        "sla_deadline": "12h (Emergency SLA)",
        "date": "Yesterday, 04:30 PM",
        "model_used": "Fine-Tuned MuRIL Transformer"
    },
    {
        "id": "GRV-2404",
        "text": "Sub-registrar office is asking for 5000 bribe for agricultural land mutation record verification.",
        "department": "Corruption & Bribery",
        "priority": "Critical",
        "urgency_score": 85,
        "status": "Under review",
        "officer": "Special Director, Anti-Corruption Bureau / Lokayukta",
        "sla_deadline": "24h (Urgent Vigilance)",
        "date": "Yesterday, 11:15 AM",
        "model_used": "Fine-Tuned MuRIL Transformer"
    },
    {
        "id": "GRV-2405",
        "text": "Government school building roof has large cracks and water leakage during class hours. Needs civil repair.",
        "department": "Education & Schools",
        "priority": "High",
        "urgency_score": 65,
        "status": "Assigned",
        "officer": "District Education Officer (DEO), Samagra Shiksha",
        "sla_deadline": "72h (Standard SLA)",
        "date": "2 days ago",
        "model_used": "Fine-Tuned MuRIL Transformer"
    }
]

def load_grievance_store() -> List[Dict[str, Any]]:
    if STORE_FILE.exists():
        try:
            with open(STORE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return list(_INITIAL_GRIEVANCES)

def save_grievance_store(items: List[Dict[str, Any]]):
    try:
        STORE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2)
    except Exception as e:
        print(f"Error saving grievances: {e}")

_GRIEVANCES_CACHE = load_grievance_store()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing GrievanceGPT AI Engine...", flush=True)
    try:
        load_classifier()
        app.state.classifier_ready = True
        print("DistilBERT / MuRIL classifier loaded successfully!", flush=True)
    except Exception as e:
        print(f"Warning: classifier pre-load deferred: {e}", flush=True)
        app.state.classifier_ready = False

    print("GrievanceGPT API is ready.", flush=True)
    yield


app = FastAPI(
    title="GrievanceGPT Enterprise e-Governance API",
    description="Automated Public Grievance Categorization, Urgency Scoring, and Smart Routing (SIH CPGRAMS Theme)",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


# --- Request Schemas ---
class AnalyzeRequest(BaseModel):
    complaint: Optional[str] = Field(None, max_length=5000)
    text: Optional[str] = Field(None, max_length=5000)
    description: Optional[str] = Field(None, max_length=5000)
    query: Optional[str] = Field(None, max_length=5000)
    message: Optional[str] = Field(None, max_length=5000)
    model: Optional[str] = Field("transformer", max_length=50)

    def get_text(self) -> str:
        for val in [self.complaint, self.text, self.description, self.query, self.message]:
            if val is not None and str(val).strip():
                return str(val).strip()
        return ""


class CompareRequest(BaseModel):
    complaint: Optional[str] = Field(None, max_length=5000)
    text: Optional[str] = Field(None, max_length=5000)
    description: Optional[str] = Field(None, max_length=5000)
    query: Optional[str] = Field(None, max_length=5000)

    def get_text(self) -> str:
        for val in [self.complaint, self.text, self.description, self.query]:
            if val is not None and str(val).strip():
                return str(val).strip()
        return ""


class GrievanceCreateRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=5000)
    citizen_name: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field("transformer", max_length=50)


class GrievanceUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, max_length=50)
    officer: Optional[str] = Field(None, max_length=150)
    notes: Optional[str] = Field(None, max_length=500)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000)


# --- System Status Endpoints ---
@app.get("/")
def root():
    return {
        "portal": "GrievanceGPT - Automated Public Grievance Triaging & Routing",
        "theme": "SIH-style CPGRAMS / e-Governance Triaging Problem Statement",
        "course_outcome": "CO1",
        "bloom_level": "L6 (Evaluate & Create)",
        "status": "operational",
        "version": "2.0.0"
    }


@app.get("/api/health")
def health():
    ready = getattr(app.state, "classifier_ready", None)
    if ready is None:
        try:
            from app.services.classifier import _model
            ready = _model is not None
        except Exception:
            ready = False

    return {
        "status": "ok",
        "service": "GrievanceGPT Public Service Intelligence",
        "classifier_loaded": bool(ready),
        "rag_ready": rag_service is not None,
        "active_tickets_count": len(_GRIEVANCES_CACHE),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/notifications")
def get_notifications():
    from app.services.classifier import _model
    ready = getattr(app.state, "classifier_ready", False) or (_model is not None)
    critical_count = sum(1 for g in _GRIEVANCES_CACHE if g.get("priority") == "Critical")

    return {
        "status": "ok",
        "notifications": [
            {
                "id": "notif-1",
                "title": "AI Classification Engine Active",
                "message": "Fine-Tuned MuRIL Transformer, Bi-LSTM & TF-IDF classifiers online.",
                "type": "success" if ready else "info",
                "time": "System active",
                "read": False
            },
            {
                "id": "notif-2",
                "title": f"Triage Alert: {critical_count} Critical Case(s)",
                "message": "Critical complaints require immediate nodal officer review within SLA.",
                "type": "alert" if critical_count > 0 else "info",
                "time": "Real-time",
                "read": False
            },
            {
                "id": "notif-3",
                "title": "FAISS Semantic Search Online",
                "message": "Duplicate prevention & historical similarity index active.",
                "type": "info",
                "time": "Active",
                "read": True
            }
        ]
    }


# --- Department Directory ---
@app.get("/api/departments")
def get_departments():
    return {
        "count": len(ROUTING_DIRECTORY),
        "departments": [
            {
                "name": dept,
                "nodal_officer": info["officer"],
                "sla_hours": info["sla_hours"],
                "official_portal": info["portal"]
            }
            for dept, info in ROUTING_DIRECTORY.items()
        ]
    }


# --- Academic Model Comparison & Confusion Matrix Endpoints (CO1 / L6) ---
@app.get("/api/models/benchmarks")
def get_model_benchmarks():
    data = get_benchmarks_data()
    if not data:
        raise HTTPException(status_code=503, detail="Benchmarks data not generated yet.")
    return data


@app.post("/api/models/compare")
def compare_models(payload: CompareRequest):
    complaint_text = payload.get_text()
    if len(complaint_text) < 2:
        raise HTTPException(status_code=422, detail="Text must contain at least 2 characters.")
    return compare_all_models(complaint_text)


# --- Core Analysis & Triage Endpoint ---
@app.post("/api/analyze")
def analyze(payload: AnalyzeRequest):
    complaint = payload.get_text()

    if len(complaint) < 2:
        raise HTTPException(
            status_code=422,
            detail="Complaint must contain at least 2 characters."
        )

    try:
        t0 = time.time()
        model_choice = (payload.model or "transformer").lower()

        # 1. Multi-model department prediction
        if model_choice == "all":
            all_preds = compare_all_models(complaint)
            # Use transformer as primary result
            primary = all_preds["models"]["transformer"]
            department = primary["department"]
            confidence = primary["confidence"]
            top = primary["top_predictions"]
            model_used = "Multi-Model Ensemble (Transformer, Bi-LSTM, TF-IDF)"
            comparison_data = all_preds
        else:
            pred_res = predict_any(complaint, model_choice)
            department = pred_res["department"]
            confidence = pred_res["confidence"]
            top = pred_res["top_predictions"]
            model_used = pred_res["model_used"]
            comparison_data = None

        # 2. Urgency and sentiment analysis (VADER + heuristic cues)
        score, priority, sentiment, keywords = calculate_urgency(complaint)

        # 3. Semantic similarity search across historical complaints
        similar = find_similar(complaint, top_n=4)

        # 4. Recommended action workflow
        action = recommend_action(priority)

        # 5. Smart routing & SLA calculation
        routing_meta = ROUTING_DIRECTORY.get(department, {
            "officer": f"Nodal Officer, Department of {department}",
            "sla_hours": 48,
            "portal": "pgportal.gov.in"
        })

        sla_deadline_hours = 12 if priority == "Critical" else 24 if priority == "High" else 48 if priority == "Medium" else 96

        total_latency_ms = round((time.time() - t0) * 1000, 2)

        return {
            "complaint": complaint,
            "predicted_department": department,
            "classification_confidence": confidence,
            "top_predictions": top,
            "model_used": model_used,
            "model_id": model_choice,
            "multi_model_comparison": comparison_data,
            "urgency_score": score,
            "priority": priority,
            "sentiment": round(sentiment, 4),
            "sentiment_label": "Negative" if sentiment < -0.05 else "Positive" if sentiment > 0.05 else "Neutral",
            "detected_keywords": keywords,
            "recommended_action": action,
            "routing_info": {
                "assigned_nodal_officer": routing_meta["officer"],
                "sla_hours": sla_deadline_hours,
                "escalation_tier": "Tier-1 Emergency Triage" if priority in ["Critical", "High"] else "Tier-2 Standard Redressal",
                "official_portal": routing_meta["portal"]
            },
            "similar_complaints": similar,
            "pipeline_latency_ms": total_latency_ms
        }

    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        print(f"Analysis error: {exc}", flush=True)
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(exc)}")


# --- Grievances Management Endpoints ---
@app.get("/api/grievances")
def get_grievances(
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    global _GRIEVANCES_CACHE
    results = list(_GRIEVANCES_CACHE)

    if search:
        s = search.lower()
        results = [g for g in results if s in g.get("text", "").lower() or s in g.get("id", "").lower() or s in g.get("department", "").lower()]

    if department and department != "All":
        results = [g for g in results if g.get("department") == department]

    if priority and priority != "All":
        results = [g for g in results if g.get("priority", "").lower() == priority.lower()]

    if status and status != "All":
        results = [g for g in results if g.get("status", "").lower() == status.lower()]

    return {
        "total": len(results),
        "grievances": results
    }


@app.post("/api/grievances")
def create_grievance(payload: GrievanceCreateRequest):
    global _GRIEVANCES_CACHE
    text = payload.text.strip()

    # Run analysis for automatic categorization and urgency
    analysis_res = analyze(AnalyzeRequest(complaint=text, model=payload.model or "transformer"))

    ticket_num = int(time.time() * 1000) % 100000
    ticket_id = f"GRV-{ticket_num:05d}"
    routing = analysis_res["routing_info"]

    new_item = {
        "id": ticket_id,
        "text": text,
        "department": analysis_res["predicted_department"],
        "priority": analysis_res["priority"],
        "urgency_score": analysis_res["urgency_score"],
        "status": "New",
        "officer": routing["assigned_nodal_officer"],
        "sla_deadline": f"{routing['sla_hours']}h ({routing['escalation_tier']})",
        "date": "Just now",
        "model_used": analysis_res["model_used"],
        "citizen_name": payload.citizen_name or "Anonymous Citizen",
        "district": payload.district or "Central Municipal District"
    }

    _GRIEVANCES_CACHE.insert(0, new_item)
    save_grievance_store(_GRIEVANCES_CACHE)

    return {
        "status": "created",
        "grievance": new_item,
        "analysis": analysis_res
    }


@app.patch("/api/grievances/{ticket_id}")
def update_grievance(ticket_id: str, payload: GrievanceUpdateRequest):
    global _GRIEVANCES_CACHE
    for item in _GRIEVANCES_CACHE:
        if item.get("id") == ticket_id:
            if payload.status:
                item["status"] = payload.status
            if payload.officer:
                item["officer"] = payload.officer
            if payload.notes:
                item["resolution_notes"] = payload.notes
            item["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            save_grievance_store(_GRIEVANCES_CACHE)
            return {"status": "updated", "grievance": item}

    raise HTTPException(status_code=404, detail=f"Grievance ticket {ticket_id} not found.")


# --- Project Q&A / RAG Assistant Endpoint ---
try:
    rag_service = ProjectRAGService()
except Exception as _e:
    print(f"ProjectRAGService initialization deferred or failed: {_e}", flush=True)
    rag_service = None


@app.post("/api/chat")
def chat_with_project(req: ChatRequest):
    global rag_service
    if rag_service is None:
        try:
            rag_service = ProjectRAGService()
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=f"RAG service unavailable: {str(exc)}"
            )
    try:
        return rag_service.answer(req.question)
    except Exception as exc:
        print(f"Chat error: {exc}", flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(exc)}"
        )
