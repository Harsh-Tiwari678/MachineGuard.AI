from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import joblib
import pandas as pd
from pymongo import MongoClient
from datetime import datetime, timezone
from Simulator import generate_data
import os
import dotenv

dotenv.load_dotenv()

app = Flask(__name__)
CORS(app)

model = joblib.load("model.pkl")

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["machineguard"]
collection = db["predictions"]

#connection path frontend to backend
@app.route("/")
@app.route("/home")
def home():
    return render_template("INDEX.HTML")

@app.route("/dashboard")
def dashboard_page():
    return render_template("DASHBOARD.HTML")

@app.route("/about")
def about_page():
    return render_template("ABOUT.HTML")

#main API jo frontend db backend ko connect krta hai taki latest prediction ko frontend me show kr ske
@app.route("/latest", methods=["GET"])
def latest():
    """Get latest prediction"""
    record = collection.find_one(sort=[("_id", -1)])
    if record:
        record["_id"] = str(record["_id"])
        return jsonify(record)
    return jsonify({})

@app.route("/history", methods=["GET"])
def history():
    """Get last 20 predictions"""
    records = list(collection.find({}, {"_id": 0}).sort("_id", -1).limit(20))
    records.reverse()
    return jsonify(records)

@app.route("/pathway-status", methods=["GET"])
def pathway_status():
    """Check if Pathway pipeline is running"""
    try:
        if os.path.exists("live_predictions.jsonl"):
            # Check ki file kitni purani hai agar 2 minutes se kam purani hai to pathway chal rha hai
            import time
            age = time.time() - os.path.getmtime("live_predictions.jsonl")
            if age < 120: 
                return jsonify({
                    "status": "running",
                    "message": "Pathway active"
                })
        return jsonify({
            "status": "stopped",
            "message": "Pathway not running"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# RAG-based maintenance assistant API jo frontend se question lega aur uska answer dega based on predefined knowledge base
@app.route("/ask", methods=["POST"])
def ask_maintenance():
    """RAG-based maintenance assistant"""
    try:
        data = request.json
        question = data.get("question", "").lower()
        
        #risk level ke hisab se predefined answer dena hai taki user ko pata chl ske ki machine me kya problem ho skta hai aur usko kaise handle krna hai
        if "high risk" in question or "failure" in question or "critical" in question:
            answer = """**HIGH RISK Protocol:**
1. 🛑 **Stop machine immediately**
2. ✅ Check tool wear (replace if > 200 min)
3. 🔧 Inspect torque (reduce if > 70 Nm)
4. 🌡️ Cool down if temp > 310K
5. 📞 Contact: +91 9690365373"""

        elif "temperature" in question or "heat" in question or "hot" in question:
            answer = """**Temperature Management:**
- ✅ Normal: < 310K
- ⚠️ Warning: 310-315K (reduce RPM by 30%)
- 🛑 Critical: > 315K (emergency shutdown)
- Check cooling system & airflow"""

        elif "tool" in question or "wear" in question:
            answer = """**Tool Wear Guidelines:**
- ✅ Normal: < 150 min
- ⚠️ Warning: 150-200 min (schedule replacement)
- 🛑 Critical: > 200 min (replace immediately)
- 🚫 Never exceed 250 min"""

        elif "medium risk" in question:
            answer = """**MEDIUM RISK Protocol:**
1. 👀 Monitor every 10 minutes
2. ⬇️ Reduce speed by 20%
3. 🔧 Prepare replacement parts
4. 📅 Schedule preventive maintenance
5. 📊 Log all readings"""

        elif "torque" in question:
            answer = """**Torque Management:**
- Normal: 20-50 Nm
- Warning: 50-70 Nm
- Critical: > 70 Nm
- Actions: Reduce load, check bearings, inspect for binding"""

        elif "rpm" in question or "speed" in question:
            answer = """**RPM Guidelines:**
- Normal range: 1200-2800 RPM
- If too high: Risk of overheating
- If too low: Inefficient operation
- Adjust based on load requirements"""

        else:
            answer = """**I can help with:**
- 🔴 High risk situations
- 🌡️ Temperature issues  
- 🔧 Tool wear management
- ⚙️ Torque & RPM problems
- 📋 Maintenance protocols

**Ask me:** "What to do in high risk?" or "How to handle high temperature?"

**Emergency Contact:** +91 9690365373"""

        return jsonify({
            "question": data.get("question"),
            "answer": answer,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# agr machine failure ka risk 70% se jada hai to high risk alert generate krna hai taki user ko pata chl ske ki machine me problem ho skta hai
@app.route("/alerts-log", methods=["GET"])
def get_alerts_log():
    """Get logged high-risk alerts"""
    try:
        if os.path.exists("high_risk_alerts.log"):
            with open("high_risk_alerts.log", "r") as f:
                logs = f.readlines()[-10:]  # Last 10 alerts
            return jsonify({"alerts": logs})
        return jsonify({"alerts": []})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    print("="*70)
    print("🚀 MACHINEGUARD AI - FLASK SERVER")
    print(f"🌐 Running on port: {port}")
    print("="*70)
    app.run(host='0.0.0.0', port=port, debug=False)

