import random

def generate_data():
    return {
        "Air temperature [K]": round(random.uniform(300, 350), 2),
        "Process temperature [K]": round(random.uniform(300, 360), 2),
        "Rotational speed [rpm]": round(random.uniform(1000, 2000), 2),
        "Torque [Nm]": round(random.uniform(20, 60), 2),
        "Tool wear [min]": round(random.uniform(0, 200), 2)
    }
