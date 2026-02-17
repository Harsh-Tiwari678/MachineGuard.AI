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

background_running = False

def background_data_generator():
    global background_running
    background_running = True
    time.sleep(2)
    counter = 1
    while background_running:
        try:
            data = generate_data()
            if random.random() < 0.3:
                data['Tool wear [min]'] = random.uniform(200, 250)
                data['Torque [Nm]'] = random.uniform(60, 80)
                data['Process temperature [K]'] += random.uniform(5, 10)
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
            total = collection.count_documents({})
            if total > 100:
                oldest = collection.find({}, {"_id": 1}).sort("_id", 1).limit(total - 100)
                for doc in oldest:
                    collection.delete_one({"_id": doc["_id"]})
            counter += 1
        except Exception as e:
            print(f"Error: {e}")
        time.sleep(10)

def start_background_thread():
    global background_running
    if not background_running:
        data_thread = threading.Thread(target=background_data_generator, daemon=True)
        data_thread.start()

# Gunicorn ke liye — function define hone ke BAAD call karo
start_background_thread()

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
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
def history():
    try:
        records = list(collection.find({}, {"_id": 0}).sort("_id", -1).limit(20))
        records.reverse()
        return jsonify(records)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/pathway-status", methods=["GET"])
def pathway_status():
    global background_running
    return jsonify({
        "status": "running" if background_running else "stopped",
        "message": "Simulator active" if background_running else "Simulator inactive",
        "interval": "10 seconds"
    })

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

@app.route("/contact", methods=["POST"])
def contact():
    try:
        data = request.json
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        message_text = data.get('message', '').strip()
        if not name or not email or not message_text:
            return jsonify({"success": False, "message": "All fields are required"}), 400
        msg = Message(
            subject=f'Contact Form: {name} - MachineGuard AI',
            recipients=['harshtiwari1806@gmail.com']
        )
        msg.html = f"<p>Name: {name}</p><p>Email: {email}</p><p>Message: {message_text}</p>"
        mail.send(msg)
        return jsonify({"success": True, "message": "Message sent!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/ask", methods=["POST"])
def ask_maintenance():
    try:
        data = request.json
        question = data.get("question", "").lower()
        if "high risk" in question or "failure" in question:
            answer = "Stop machine immediately! Check tool wear and torque."
        elif "temperature" in question:
            answer = "Normal: < 310K, Warning: 310-315K, Critical: > 315K"
        elif "tool" in question or "wear" in question:
            answer = "Normal: < 150 min, Warning: 150-200 min, Critical: > 200 min"
        else:
            answer = "Ask about: high risk, temperature, tool wear, torque, or RPM"
        return jsonify({"question": data.get("question"), "answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)