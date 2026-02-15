#pipeline for pathway live data streaming hioti rhe isliye 
import pathway as pw
import joblib
import pandas as pd
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone
import time
import random
import threading

load_dotenv()

# MongoDB ko connect kra hai
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["machineguard"]
collection = db["predictions"]

# model loading or connection
print("🔄 Loading ML model...")
model = joblib.load("model.pkl")
print("✅ Model loaded!\n")

from Simulator import generate_data

# CSV me data ko genrate krnataki live  streaming ho ske
def create_streaming_csv():
    csv_file = "temp_sensor_stream.csv"
    
    data = generate_data()
    data['Type'] = random.choice([0, 1, 2])
    
    df = pd.DataFrame([{
        'Type': data['Type'],
        'air_temp': data['Air temperature [K]'],
        'process_temp': data['Process temperature [K]'],
        'rpm': data['Rotational speed [rpm]'],
        'torque': data['Torque [Nm]'],
        'tool_wear': data['Tool wear [min]']
    }])
    
    df.to_csv(csv_file, index=False)
    print("📊 Data generation started (30s interval)")
    
    counter = 1
    while True:
        time.sleep(30)
        
        data = generate_data()
        data['Type'] = random.choice([0, 1, 2])
        
        # 30%  se km ho to risk ka alert dena taki mahcine failure ka pata chl ske
        if random.random() < 0.3:
            data['Tool wear [min]'] = random.uniform(200, 250)
            data['Torque [Nm]'] = random.uniform(60, 80)
            data['Process temperature [K]'] += random.uniform(5, 10)
        
        df = pd.DataFrame([{
            'Type': data['Type'],
            'air_temp': data['Air temperature [K]'],
            'process_temp': data['Process temperature [K]'],
            'rpm': data['Rotational speed [rpm]'],
            'torque': data['Torque [Nm]'],
            'tool_wear': data['Tool wear [min]']
        }])
        
        df.to_csv(csv_file, mode='a', header=False, index=False)
        counter += 1

csv_thread = threading.Thread(target=create_streaming_csv, daemon=True)
csv_thread.start()
time.sleep(3)

print("🔧 Creating Pathway pipeline...")

class SensorSchema(pw.Schema):
    Type: int
    air_temp: float
    process_temp: float
    rpm: float
    torque: float
    tool_wear: float

sensor_data = pw.io.csv.read(
    "temp_sensor_stream.csv",
    schema=SensorSchema,
    mode="streaming"
)

@pw.udf
def predict_failure(type_val: int, air_temp: float, process_temp: float, 
                    rpm: float, torque: float, wear: float) -> str:
    try:
        # model ka input data ko format krna hai taki model usko samajh ske
        input_data = pd.DataFrame([{
            'Type': int(type_val),
            'Air temperature [K]': float(air_temp),
            'Process temperature [K]': float(process_temp),
            'Rotational speed [rpm]': float(rpm),
            'Torque [Nm]': float(torque),
            'Tool wear [min]': float(wear)
        }])
        
        # values printing for debugging
        print(f"Predicting with: {input_data.values[0]}")
        
        prediction = int(model.predict(input_data)[0])
        result = "Machine Failure" if prediction == 1 else "Machine Healthy"
        print(f"✅ Prediction: {result}")
        return result
        #error ko handle ho rha hai taki pipeline crash na ho
    except Exception as e:
        print(f"❌ Prediction Error: {e}")
        print(f"Input was: Type={type_val}, Temp={air_temp}, RPM={rpm}")
        return "Machine Healthy"  

@pw.udf
def calculate_risk(type_val: int, air_temp: float, process_temp: float, 
                   rpm: float, torque: float, wear: float) -> float:
    try:
        input_data = pd.DataFrame([{
            'Type': int(type_val),
            'Air temperature [K]': float(air_temp),
            'Process temperature [K]': float(process_temp),
            'Rotational speed [rpm]': float(rpm),
            'Torque [Nm]': float(torque),
            'Tool wear [min]': float(wear)
        }])
        
        proba = model.predict_proba(input_data)[0][1]
        print(f"✅ Risk probability: {proba*100:.1f}%")
        return float(proba)
        
    except Exception as e:
        print(f"❌ Risk calculation error: {e}")
        #35% se km ho to low risk ka alert dena taki mahcine failure ka pata chl ske
        return float(random.uniform(0.05, 0.35))

@pw.udf
def get_risk_level(prob: float) -> str:
    if prob >= 0.7:
        return "HIGH RISK"
    elif prob >= 0.4:
        return "MEDIUM RISK"
    else:
        return "LOW RISK"

predictions = sensor_data.select(
    type_val=pw.this.Type,
    air_temp=pw.this.air_temp,
    process_temp=pw.this.process_temp,
    rotational_speed=pw.this.rpm,
    torque=pw.this.torque,
    tool_wear=pw.this.tool_wear,
    prediction=predict_failure(
        pw.this.Type, pw.this.air_temp, pw.this.process_temp,
        pw.this.rpm, pw.this.torque, pw.this.tool_wear
    ),
    failure_probability=calculate_risk(
        pw.this.Type, pw.this.air_temp, pw.this.process_temp,
        pw.this.rpm, pw.this.torque, pw.this.tool_wear
    )
)

final_predictions = predictions.select(
    *pw.this,
    risk_level=get_risk_level(pw.this.failure_probability)
)

def save_to_mongodb(key, row, time, is_addition):
    try:
        if not is_addition:
            return
            
        data = {
            'Type': row['type_val'],
            'Air temperature [K]': row['air_temp'],
            'Process temperature [K]': row['process_temp'],
            'Rotational speed [rpm]': row['rotational_speed'],
            'Torque [Nm]': row['torque'],
            'Tool wear [min]': row['tool_wear'],
            'prediction': row['prediction'],
            'failure_probability': row['failure_probability'],
            'risk_level': row['risk_level'],
            'timestamp': datetime.now(timezone.utc),
            'status': f"{row['process_temp']:.2f}°K"
        }
        
        result = collection.insert_one(data)
        
        # Keep only last 100 records in MongoDB to prevent bloat jada ho to purana data delete kr dena
        total = collection.count_documents({})
        if total > 100:
            oldest = collection.find({}, {"_id": 1}).sort("_id", 1).limit(total - 100)
            for doc in oldest:
                collection.delete_one({"_id": doc["_id"]})
        
        # Risk level ke hisab se alert generate krna hai aur high risk ko log file me save krna hai taki future me analysis ke liye use kr ske
        if row['risk_level'] == "HIGH RISK":
            with open("high_risk_alerts.log", "a") as f:
                f.write(f"{datetime.now()} | ALERT | Risk: {row['failure_probability']*100:.1f}% | Temp: {row['process_temp']:.1f}K\n")
        
        emoji = "🔴" if row['risk_level'] == "HIGH RISK" else "🟡" if row['risk_level'] == "MEDIUM RISK" else "🟢"
        print(f"{emoji} {row['prediction']} | Risk: {row['failure_probability']*100:.1f}% | Temp: {row['process_temp']:.2f}°K | Saved: {result.inserted_id}")
        
    except Exception as e:
        print(f"❌ MongoDB Error: {e}")

pw.io.subscribe(final_predictions, on_change=save_to_mongodb)
pw.io.jsonlines.write(final_predictions, "live_predictions.jsonl")

if __name__ == "__main__":
    print("="*70)
    print("🚀 PATHWAY PIPELINE STARTED")
    print("="*70)
    print("📊 Generating data every 30 seconds")
    print("💾 Saving to MongoDB")
    print("📝 Logging HIGH RISK events to high_risk_alerts.log")
    print("="*70)
    print()
    
    pw.run()