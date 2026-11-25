import sys
from pathlib import Path
sys.path.insert(0, str(Path("backend").resolve()))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("Testing GET /api/health...")
r = client.get("/api/health")
assert r.status_code == 200, r.text
print("OK:", r.json())

print("Testing GET /api/notifications...")
r = client.get("/api/notifications")
assert r.status_code == 200, r.text
print("OK: notifications count =", len(r.json()["notifications"]))

print("Testing GET /api/departments...")
r = client.get("/api/departments")
assert r.status_code == 200, r.text
print("OK: departments count =", len(r.json()["departments"]))

print("Testing GET /api/models/benchmarks...")
r = client.get("/api/models/benchmarks")
assert r.status_code == 200, r.text
print("OK: benchmark models =", r.json()["models"])

print('Testing POST /api/models/compare...')
r = client.post('/api/models/compare', json={'complaint': 'No drinking water for 5 days in my locality.'})
assert r.status_code == 200, r.text
print('OK: consensus =', r.json()['consensus'], 'models =', list(r.json()['models'].keys()))

print("Testing POST /api/analyze with Transformer...")
r = client.post("/api/analyze", json={"complaint": "No drinking water for 5 days in my locality.", "model": "transformer"})
assert r.status_code == 200, r.text
res = r.json()
print("OK: department =", res["predicted_department"], "priority =", res["priority"], "urgency =", res["urgency_score"])

print("Testing POST /api/analyze with Bi-LSTM...")
r = client.post("/api/analyze", json={"complaint": "Electricity transformer blew up sparking fire.", "model": "bilstm"})
assert r.status_code == 200, r.text
print("OK Bi-LSTM: department =", r.json()["predicted_department"])

print("Testing POST /api/analyze with TF-IDF...")
r = client.post("/api/analyze", json={"complaint": "Garbage dump near school causing dengue.", "model": "tfidf"})
assert r.status_code == 200, r.text
print("OK TF-IDF: department =", r.json()["predicted_department"])

print("Testing POST /api/grievances (Ticket Creation)...")
r = client.post("/api/grievances", json={"text": "Sewage water leaking into school playground.", "citizen_name": "Ramesh Kumar", "district": "North West"})
assert r.status_code == 200, r.text
ticket = r.json()["grievance"]
print("OK created ticket:", ticket["id"], ticket["department"], ticket["priority"])

print("Testing PATCH /api/grievances/{ticket_id}...")
r = client.patch(f"/api/grievances/{ticket['id']}", json={"status": "In progress"})
assert r.status_code == 200, r.text
print("OK status updated:", r.json()["grievance"]["status"])

print('Testing GET /api/grievances...')
r = client.get('/api/grievances')
assert r.status_code == 200, r.text
print('OK total grievances:', r.json()['total'])

print('Testing POST /api/chat (RAG Q&A)...')
r = client.post('/api/chat', json={'question': 'What are the core techniques used in GrievanceGPT?'})
assert r.status_code == 200, r.text
chat_res = r.json()
print('OK RAG answer received, length =', len(chat_res['answer']), 'sources =', len(chat_res['sources']))

print('ALL API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!')
