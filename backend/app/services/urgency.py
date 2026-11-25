from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()
CRITICAL = ["death", "died", "life threatening", "emergency", "suicide", "fire", "collapse", "accident"]
HIGH = ["urgent", "immediately", "no water", "no electricity", "missing person", "violence", "hospital", "days", "weeks"]
MEDIUM = ["delay", "not working", "damaged", "problem", "issue", "pending", "harassment"]
GROUP = ["residents", "people", "families", "locality", "village", "entire area", "hundreds"]
DURATION = ["days", "weeks", "months", "since last", "for a long time"]

def calculate_urgency(text: str):
    lower = text.lower()
    score = 0
    detected = []
    for word in CRITICAL:
        if word in lower:
            score += 60; detected.append(word)
    for word in HIGH:
        if word in lower:
            score += 35; detected.append(word)
    for word in MEDIUM:
        if word in lower:
            score += 15; detected.append(word)
    if any(w in lower for w in GROUP):
        score += 15; detected.append("multiple people affected")
    if any(w in lower for w in DURATION):
        score += 10; detected.append("long duration")
    sentiment = _analyzer.polarity_scores(text)["compound"]
    score += int(max(0, -sentiment) * 15)
    score = min(score, 100)
    priority = "Critical" if score >= 80 else "High" if score >= 60 else "Medium" if score >= 30 else "Low"
    return score, priority, sentiment, list(dict.fromkeys(detected))

def recommend_action(priority: str):
    return {
        "Critical": "Immediate human review and emergency escalation.",
        "High": "Prioritize prompt departmental investigation.",
        "Medium": "Assign to the responsible department for timely resolution.",
        "Low": "Register the grievance and follow the normal workflow."
    }.get(priority, "Register the grievance for departmental review.")
