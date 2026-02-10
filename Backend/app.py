from flask import Flask, jsonify, render_template
from flask_cors import CORS
import joblib
import pandas as pd
from pymongo import MongoClient
from datetime import datetime
from Simulator import generate_data
import os
import dotenv
from datetime import datetime, timezone



dotenv.load_dotenv()

app = Flask(__name__)
CORS(app)

model = joblib.load("model.pkl")


MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["machineguard"]
collection = db["predictions"]

FEATURES = [
    'Air temperature [K]',
    'Process temperature [K]',
    'Rotational speed [rpm]',
    'Torque [Nm]',
    'Tool wear [min]'
]


@app.route("/")
def home():
  
    machine = {
        "name": "Machine 1",
        "status": "Unknown",
        "prediction": "No data"
    }
    return render_template("index.html", machine=machine)


@app.route("/simulate", methods=["GET"])
def simulate():
    try:

        data = generate_data()
        input_df = pd.DataFrame([data])

     
        prediction = int(model.predict(input_df)[0])
        result = "Machine Failure" if prediction == 1 else "Machine Healthy"

        data["prediction"] = result
        data["timestamp"] = datetime.now(timezone.utc) 

        collection.insert_one(data)

        total_docs = collection.count_documents({})
        if total_docs > 100:
            oldest_docs = collection.find({}, {"_id": 1}).sort("_id", 1).limit(total_docs - 100)
            for doc in oldest_docs:
                collection.delete_one({"_id": doc["_id"]})

        data["_id"] = str(data.get("_id", ""))

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/latest", methods=["GET"])
def latest():
    record = collection.find_one(sort=[("_id", -1)])
    if record:
        record["_id"] = str(record["_id"])
        return jsonify(record)
    return jsonify({})

@app.route("/history", methods=["GET"])
def history():
    records = list(collection.find({}, {"_id": 0}).sort("_id", -1).limit(20))
    records.reverse()
    return jsonify(records)

if __name__ == "__main__":
    app.run(debug=True)
