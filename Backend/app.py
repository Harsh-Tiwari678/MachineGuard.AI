from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from flask_mail import Mail, Message
import joblib
import pandas as pd
from pymongo import MongoClient
from datetime import datetime, timezone
from Simulator import generate_data
import os
import dotenv
import threading
import time
import random

dotenv.load_dotenv()
app = Flask(__name__)
CORS(app)

# Email Configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

mail = Mail(app)

model = joblib.load("model.pkl")

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["machineguard"]
collection = db["predictions"]

# ✅ YE LINE ADD KARO YAHAN

import threading
data_thread = threading.Thread(target=background_data_generator, daemon=True)
data_thread.start()

# Global flag to track if background thread is running
background_running = False

# Background thread jo har 10 seconds me data generate karega
def background_data_generator():
    global background_running
    background_running = True
    
    print("\n" + "="*70)
    print("🔄 BACKGROUND DATA GENERATOR STARTED")
    print("⏱️  Interval: 10 seconds")
    print("="*70 + "\n")
    
    time.sleep(2)
    
    counter = 1
    while background_running:
        try:
            print(f"\n📊 Generating prediction #{counter}...")
            
            data = generate_data()
            
            if random.random() < 0.3:
                data['Tool wear [min]'] = random.uniform(200, 250)
                data['Torque [Nm]'] = random.uniform(60, 80)
                data['Process temperature [K]'] += random.uniform(5, 10)
                print("⚠️  Generated HIGH RISK scenario")
            
            input_data = pd.DataFrame([{
                'Air temperature [K]': float(data['Air temperature [K]']),
                'Process temperature [K]': float(data['Process temperature [K]']),
                'Rotational speed [rpm]': float(data['Rotational speed [rpm]']),
                'Torque [Nm]': float(data['Torque [Nm]']),
                'Tool wear [min]': float(data['Tool wear [min]'])
            }])
            
            prediction = int(model.predict(input_data)[0])
            failure_probability = float(model.predict_proba(input_data)[0][1])
            
            if failure_probability >= 0.7:
                risk_level = "HIGH RISK"
            elif failure_probability >= 0.4:
                risk_level = "MEDIUM RISK"
            else:
                risk_level = "LOW RISK"
            
            mongo_data = {
                'Air temperature [K]': data['Air temperature [K]'],
                'Process temperature [K]': data['Process temperature [K]'],
                'Rotational speed [rpm]': data['Rotational speed [rpm]'],
                'Torque [Nm]': data['Torque [Nm]'],
                'Tool wear [min]': data['Tool wear [min]'],
                'prediction': "Machine Failure" if prediction == 1 else "Machine Healthy",
                'failure_probability': failure_probability,
                'risk_level': risk_level,
                'timestamp': datetime.now(timezone.utc),
                'status': f"{data['Process temperature [K]']:.2f}°K"
            }
            
            result = collection.insert_one(mongo_data)
            
            total = collection.count_documents({})
            if total > 100:
                oldest = collection.find({}, {"_id": 1}).sort("_id", 1).limit(total - 100)
                for doc in oldest:
                    collection.delete_one({"_id": doc["_id"]})
            
            if risk_level == "HIGH RISK":
                with open("high_risk_alerts.log", "a") as f:
                    f.write(f"{datetime.now()} | ALERT | Risk: {failure_probability*100:.1f}% | Temp: {data['Process temperature [K]']:.1f}K\n")
            
            emoji = "🔴" if risk_level == "HIGH RISK" else "🟡" if risk_level == "MEDIUM RISK" else "🟢"
            print(f"{emoji} [{counter}] {mongo_data['prediction']} | Risk: {failure_probability*100:.1f}% | Temp: {data['Process temperature [K]']:.2f}°K | ID: {result.inserted_id}")
            
            counter += 1
            
        except Exception as e:
            print(f"❌ Background Error: {e}")
            import traceback
            traceback.print_exc()
        
        time.sleep(10)

def start_background_thread():
    global background_running
    if not background_running:
        data_thread = threading.Thread(target=background_data_generator, daemon=True)
        data_thread.start()
        print("✅ Background thread initialized")

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
@app.route("/thankyou")
def thank_you():
    return render_template("thankyou.html")



@app.route("/latest", methods=["GET"])
def latest():
    try:
        record = collection.find_one(sort=[("_id", -1)])
        if record:
            record["_id"] = str(record["_id"])
            return jsonify(record)
        return jsonify({"message": "No data yet"})
    except Exception as e:
        print(f"❌ Latest API Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
def history():
    try:
        records = list(collection.find({}, {"_id": 0}).sort("_id", -1).limit(20))
        records.reverse()
        return jsonify(records)
    except Exception as e:
        print(f"❌ History API Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/pathway-status", methods=["GET"])
def pathway_status():
    global background_running
    return jsonify({
        "status": "running" if background_running else "stopped",
        "message": "Simulator active" if background_running else "Simulator inactive",
        "interval": "10 seconds"
    })

@app.route("/contact", methods=["POST"])
def contact():
    """Handle contact form submissions and send email"""
    try:
        data = request.json
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        message_text = data.get('message', '').strip()
        
        if not name or not email or not message_text:
            return jsonify({
                "success": False,
                "message": "All fields are required"
            }), 400
        
        msg = Message(
            subject=f'Contact Form: {name} - MachineGuard AI',
            recipients=['harshtiwari1806@gmail.com']
        )
        
        msg.html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }}
                .field {{ margin-bottom: 15px; }}
                .label {{ font-weight: bold; color: #667eea; }}
                .value {{ margin-top: 5px; padding: 10px; background: white; border-left: 3px solid #667eea; }}
                .footer {{ background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0;">🔔 New Contact Form Submission</h2>
                    <p style="margin: 5px 0 0 0;">MachineGuard AI Dashboard</p>
                </div>
                <div class="content">
                    <div class="field">
                        <div class="label">👤 Name:</div>
                        <div class="value">{name}</div>
                    </div>
                    <div class="field">
                        <div class="label">📧 Email:</div>
                        <div class="value">{email}</div>
                    </div>
                    <div class="field">
                        <div class="label">💬 Message:</div>
                        <div class="value">{message_text}</div>
                    </div>
                    <div class="field">
                        <div class="label">🕒 Received:</div>
                        <div class="value">{datetime.now().strftime('%B %d, %Y at %I:%M %p')}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>This email was sent from MachineGuard AI Contact Form</p>
                    <p>&copy; 2026 MachineGuard AI - Predictive Maintenance System</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        mail.send(msg)
        
        print(f"✅ Contact form email sent successfully from: {email}")
        
        return jsonify({
            "success": True,
            "message": "Thank you! Your message has been sent successfully. We'll get back to you soon."
        })
        
    except Exception as e:
        print(f"❌ Contact Email Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Failed to send message. Please try again or contact us directly at harshtiwari1806@gmail.com"
        }), 500

@app.route("/ask", methods=["POST"])
def ask_maintenance():
    try:
        data = request.json
        question = data.get("question", "").lower()
        
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

@app.route("/alerts-log", methods=["GET"])
def get_alerts_log():
    try:
        if os.path.exists("high_risk_alerts.log"):
            with open("high_risk_alerts.log", "r") as f:
                logs = f.readlines()[-10:]
            return jsonify({"alerts": logs})
        return jsonify({"alerts": []})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/generate-now", methods=["POST"])
def generate_now():
    try:
        data = generate_data()
        
        input_data = pd.DataFrame([{
            'Air temperature [K]': float(data['Air temperature [K]']),
            'Process temperature [K]': float(data['Process temperature [K]']),
            'Rotational speed [rpm]': float(data['Rotational speed [rpm]']),
            'Torque [Nm]': float(data['Torque [Nm]']),
            'Tool wear [min]': float(data['Tool wear [min]'])
        }])
        
        prediction = int(model.predict(input_data)[0])
        failure_probability = float(model.predict_proba(input_data)[0][1])
        
        if failure_probability >= 0.7:
            risk_level = "HIGH RISK"
        elif failure_probability >= 0.4:
            risk_level = "MEDIUM RISK"
        else:
            risk_level = "LOW RISK"
        
        mongo_data = {
            'Air temperature [K]': data['Air temperature [K]'],
            'Process temperature [K]': data['Process temperature [K]'],
            'Rotational speed [rpm]': data['Rotational speed [rpm]'],
            'Torque [Nm]': data['Torque [Nm]'],
            'Tool wear [min]': data['Tool wear [min]'],
            'prediction': "Machine Failure" if prediction == 1 else "Machine Healthy",
            'failure_probability': failure_probability,
            'risk_level': risk_level,
            'timestamp': datetime.now(timezone.utc),
            'status': f"{data['Process temperature [K]']:.2f}°K"
        }
        
        collection.insert_one(mongo_data)
        
        return jsonify({"success": True, "data": mongo_data})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    
    print("\n" + "="*70)
    print("🚀 MACHINEGUARD AI - FLASK SERVER (SIMULATOR MODE)")
    print(f"🌐 Running on port: {port}")
    print("📊 Background data generation: Every 10 seconds")
    print("📧 Email service: Configured")
    print("="*70 + "\n")
    
    start_background_thread()
    
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)