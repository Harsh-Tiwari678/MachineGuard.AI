<div align="center">

# 🛡️ MachineGuard AI  
### AI-Powered Predictive Maintenance for Sustainable Manufacturing

![Python](https://img.shields.io/badge/Python-3.10-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)
![ML](https://img.shields.io/badge/Model-RandomForest-orange.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Maintained](https://img.shields.io/badge/Maintained-Active-success.svg)

**🚨 Predict Failures 6+ Hours Early | 💰 Save ₹120L+ Annually | ⚡ Reduce Downtime by 80%**

🌐 **Live Demo:** https://machineguard-ai-2.onrender.com/  
📂 **GitHub Repository:** https://github.com/Harsh-Tiwari678/MachineGuard.AI  

</div>

---

# 📌 Overview

MachineGuard AI is a real-time predictive maintenance platform that prevents unexpected industrial machine failures using Machine Learning and cloud-based monitoring.

The system continuously monitors five critical machine parameters:

- Air Temperature  
- Process Temperature  
- Rotational Speed (RPM)  
- Torque  
- Tool Wear  

Using a trained Random Forest classifier on 10,000+ industrial records, the system achieves **95% prediction accuracy** and provides **6+ hours of early failure warning**.

The objective is to shift industries from reactive maintenance to proactive, AI-driven preventive maintenance.

---

# ❗ Problem Statement

Manufacturing industries suffer heavy losses due to unplanned machine breakdowns:

- ⛔ 48+ hours downtime per failure  
- 💰 ₹50L+ daily production loss  
- ⚠️ No real-time machine health tracking  
- 🔧 Reactive maintenance instead of predictive  
- 🌍 Energy waste and environmental damage  

Traditional systems detect failures after damage occurs.  
MachineGuard AI predicts failures before they happen.

---

# ✅ Solution

MachineGuard AI transforms industrial safety through:

## 🤖 AI Prediction Engine
- Random Forest ML model  
- Real-time failure probability calculation  
- Risk classification (Low / Medium / High)  
- 95% model accuracy  
- 6+ hour early warning system  

## 📊 Live Monitoring Dashboard
- Sensor data updates every 10 seconds  
- Historical trend analysis  
- Interactive visualization  
- Mobile-responsive UI  

## 🔔 Smart Alert System
- Email notifications for high-risk cases  
- Alert logging  
- Automated emergency triggers  

## 💬 AI Maintenance Assistant
- Context-aware chatbot  
- Troubleshooting guidance  
- Maintenance protocol suggestions  

---

# 🧠 Machine Learning Details

- Dataset Size: 10,000+ records  
- Algorithm: Random Forest Classifier  
- Train/Test Split: 80/20  
- Accuracy: 95%  
- Metrics Evaluated:
  - Precision  
  - Recall  
  - F1 Score  
  - Confusion Matrix  

Model is serialized using `joblib` and deployed via Flask REST API.

---

# 🛠️ Tech Stack

## Backend
- Python 3.10  
- Flask 3.0  
- Flask-Mail  
- Flask-CORS  
- pymongo  
- gunicorn  

## Machine Learning
- scikit-learn  
- pandas  
- numpy  
- joblib  

## Frontend
- HTML5 / CSS3 / JavaScript  
- Three.js  
- GSAP  
- AOS Animations  
- Particles.js  

## Database & Deployment
- MongoDB Atlas  
- Render Hosting  
- Git & GitHub  

---

# 🏗️ System Architecture

User Interface  
⬇  
Flask REST API  
⬇  
ML Prediction Engine + MongoDB Atlas  
⬇  
Sensor Data Simulator  

Predictions are updated every 10 seconds and stored in the cloud database.

---

# 📁 Project Structure

```
MachineGuard.AI/
│
├── Backend/
│   ├── app.py
│   ├── model.pkl
│   ├── requirements.txt
│   ├── routes/
│   └── utils/
│
├── Frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── static/
│   └── assets/
│
├── screenshots/
├── .env.example
└── README.md
```

---

# ⚙️ Installation

## Prerequisites
- Python 3.10+
- MongoDB Atlas account
- Gmail App Password

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Harsh-Tiwari678/MachineGuard.AI.git
cd MachineGuard.AI/Backend
```

## 2️⃣ Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

## 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

## 4️⃣ Setup Environment Variables

Create `.env` file:

```
MONGO_URI=
MAIL_SERVER=
MAIL_PORT=
MAIL_USE_TLS=
MAIL_USERNAME=
MAIL_PASSWORD=
```

## 5️⃣ Run Application

```bash
python app.py
```

Access at:  
http://localhost:5000

---

# 📡 API Endpoints

### GET /latest  
Returns latest prediction.

### GET /history  
Returns last 20 predictions.

### POST /contact  
Handles contact form messages.

### POST /ask  
Handles AI assistant queries.

### GET /alerts-log  
Returns high-risk alert history.

---

# 📊 Impact & Results

| Metric | Result |
|--------|--------|
| Downtime Reduction | 80% |
| Annual Savings | ₹120L+ |
| Prediction Accuracy | 95% |
| Early Warning | 6+ Hours |
| Maintenance Type | Proactive |

*Impact metrics based on simulated industrial case study analysis.*

---

# 🌍 Environmental Impact

- Reduced energy waste  
- Lower carbon footprint  
- Minimized material damage  
- Enables sustainable manufacturing  

---

# 🔮 Future Enhancements

- IoT hardware integration (Arduino / Raspberry Pi)  
- MQTT protocol implementation  
- Mobile applications (Android / iOS)  
- Multi-machine monitoring  
- Deep learning model integration  
- Enterprise ERP integration  

---

# 🤝 Contributing

1. Fork the repository  
2. Create a feature branch  
3. Commit changes  
4. Push to branch  
5. Open Pull Request  

Follow PEP 8 coding standards and update documentation accordingly.

---

# 👥 Team

Harsh Tiwari – Backend & Deployment  
Goldi Gond – AI/ML Development & Research  

---

<div align="center">

⭐ If you find this project valuable, please consider starring the repository.  

Built for innovation, safety, and sustainable manufacturing.

</div>
