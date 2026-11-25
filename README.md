# GrievanceGPT – Automated Public Grievance Categorization & Routing

**Project 9: GrievanceGPT (SIH CPGRAMS & e-Governance Theme)**  
*Course Outcome:* **CO1** | *Bloom's Taxonomy Level:* **L6 (Evaluate & Create)**

---

## 🏛️ Problem Statement & Proposed Solution

Government grievance portals such as CPGRAMS receive tens of thousands of citizen complaints daily across 14 municipal and federal departments. Manually reading, assessing urgency, and routing each complaint to the correct nodal officer is slow, creating severe backlogs and delaying public service redressal.

**GrievanceGPT** provides an end-to-end automated AI triaging pipeline:
1. **Multi-Model Categorization**:
   - **TF-IDF + Logistic Regression Baseline** (*Bloom L4 - Analyze*): Ultra-fast, lightweight n-gram classifier.
   - **PyTorch Bi-LSTM Deep Sequence Classifier** (*Bloom L5 - Synthesize*): Recurrent context modeling for long citizen complaints.
   - **Fine-Tuned Multilingual Transformer** (*Bloom L6 - Evaluate*): Attention-based semantic classifier across 14 public departments.
   - **Ensemble Consensus Mode**: Multi-model agreement verification.
2. **Urgency & Priority Scoring**:
   - VADER sentiment polarity analysis combined with temporal urgency keywords, affected population size, and critical distress cues.
   - 4-Tier classification: `Critical`, `High`, `Medium`, `Low`.
3. **Automated CPGRAMS Routing**:
   - Automated assignment to designated nodal officers (e.g. Chief Engineer Jal Board, SP Law & Grievance Cell, CMO).
   - Citizen charter SLA deadlines (`12h`, `24h`, `48h`, `72h`) and escalation tiers.
4. **Academic Evaluation & 14×14 Confusion Matrix**:
   - Interactive 14×14 confusion matrix heatmap with cell-level actual vs predicted inspection.
   - Per-department Precision, Recall, F1-Score, and Support classification reports.
   - Root-cause qualitative error analysis on overlapping vocabulary pairs.
5. **Semantic Similarity & Duplicate Detection**:
   - Sentence-BERT (`all-MiniLM-L6-v2`) + FAISS vector search across historical complaints.
6. **Project AI Assistant (RAG Q&A)**:
   - Vector-retrieval pipeline powered by FAISS and Google Gemini GenAI (`gemini-2.5-flash`), with offline retrieval fallback.
7. **Production CPGRAMS Operations Register**:
   - Live grievance case management, status tracking (`New` -> `Assigned` -> `In progress` -> `Escalated` -> `Resolved`), and CSV export.

---

## 📁 Project Architecture & Structure

```
GrievanceGPT-main/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI REST API & route definitions
│   │   ├── services/
│   │   │   ├── classifier.py           # Transformer model inference
│   │   │   ├── multi_model_service.py  # TF-IDF, Bi-LSTM & Transformer orchestrator
│   │   │   ├── train_eval_models.py    # Training & confusion matrix generator
│   │   │   ├── urgency.py              # Urgency heuristic & sentiment engine
│   │   │   ├── similarity.py           # FAISS semantic similarity search
│   │   │   └── rag_qa.py               # RAG assistant with Gemini GenAI
│   │   └── data/
│   ├── models/                         # Trained model binaries & benchmark exports
│   │   ├── best_transformer_augmented/ # Fine-tuned weights (model.safetensors)
│   │   ├── bilstm_model.pt             # PyTorch Bi-LSTM weights
│   │   ├── bilstm_vocab.json           # Bi-LSTM vocabulary dictionary
│   │   ├── tfidf_model.joblib          # Scikit-learn TF-IDF baseline pipeline
│   │   ├── model_benchmarks.json       # 14x14 confusion matrix & metrics
│   │   ├── project_rag.index           # FAISS vector index
│   │   └── project_chunks.json         # RAG knowledge chunks
│   ├── requirements.txt
│   └── test_e2e_api.py                 # Automated end-to-end endpoint verification
├── data/
│   ├── grievances_store.json           # Live grievance persistence store
│   └── processed/complaints_corpus.csv # Historical complaint corpus
└── frontend/
    ├── src/
    │   ├── App.jsx                     # Core application shell & navigation
    │   ├── index.css                   # National portal e-Governance theme styling
    │   └── components/
    │       ├── TriagingView.jsx        # Multi-model complaint triaging interface
    │       ├── ConfusionMatrixView.jsx # 14x14 interactive heatmap & CO1 report
    │       ├── GrievanceRegisterView.jsx # Operations case queue & CSV exporter
    │       ├── DepartmentsView.jsx     # 14 Government departments catalog
    │       └── ProjectChat.jsx         # RAG Q&A conversational assistant
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Quick Start Guide

### 1. Start the FastAPI Backend

Open a terminal (e.g., PowerShell on Windows) in the root directory:

```powershell
cd backend

# Activate Python virtual environment
.\venv\Scripts\Activate.ps1

# (Optional: Set Gemini API key for live conversational LLM answers)
$env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Launch the FastAPI application
uvicorn app.main:app --reload --port 8000
```

> **API Documentation**: Open your browser at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) to view all live interactive endpoints.

---

### 2. Start the React Frontend

Open a second terminal in the root directory:

```powershell
cd frontend

# Start the Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 Local Data and Model Files

The live grievance store and complaint corpus are excluded from Git because they may contain sensitive complaint text. Add only a public, anonymized corpus at `data/processed/complaints_corpus.csv` if you want to enable similar-complaint search. The trained transformer weights are stored with Git LFS; install Git LFS before cloning or pulling the model.

Set `GEMINI_API_KEY` in your environment to enable Gemini answers. Do not put API keys in startup scripts or commit them to the repository.

---

## 🧪 End-to-End Test Suite

Run the automated test suite to verify all 10 API endpoints, models, and stores:

```powershell
backend\venv\Scripts\python.exe backend\test_e2e_api.py
```

---

## 🏛️ Supported Public Departments (14)

1. Water Supply (`jaljeevan.gov.in`)
2. Police & Law and Order (`cctns.gov.in`)
3. Electricity (`urjavaran.gov.in`)
4. Sanitation & Garbage (`swachhbharat.gov.in`)
5. Roads & Infrastructure (`morth.nic.in`)
6. Healthcare & Hospitals (`mohfw.gov.in`)
7. Education & Schools (`samagra.education.gov.in`)
8. Corruption & Bribery (`cpcb.gov.in`)
9. Employment & Labour (`shramsuvidha.gov.in`)
10. Banking & Financial Services (`rbi.org.in`)
11. Land Records & Revenue (`dlrc.gov.in`)
12. Pension & Provident Fund (`epfindia.gov.in`)
13. Ration & Public Distribution System (`nfsa.gov.in`)
14. Municipal Certificates (`edistrict.gov.in`)

---

## 🎓 Academic Alignment

- **Course Outcome CO1**: Design and implement machine learning text classifiers for public grievance categorization, sequence modeling, and sentiment-driven prioritization.
- **Bloom's Taxonomy Level L6 (Evaluate & Create)**: Multi-model comparative benchmarks across TF-IDF, Bi-LSTM, and Transformer networks, complete with 14×14 confusion matrix error analysis, precision/recall/F1 metrics, and intelligent escalation routing.
