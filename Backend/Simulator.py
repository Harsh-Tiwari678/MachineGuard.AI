# Simulator.py
import random

def generate_data():
    """Generate random sensor data for machine"""
    #sensor jo data grenrate kr rha hai usme 5 parameters hai
    air_temp = round(random.uniform(295.0, 305.0), 1)  
    process_temp = round(air_temp + random.uniform(5.0, 15.0), 1)  
    rotational_speed = round(random.uniform(1200, 2800), 0) 
    torque = round(random.uniform(20.0, 80.0), 1)  
    tool_wear = round(random.uniform(0, 250), 0)  
    
    data = {
        'Air temperature [K]': air_temp,
        'Process temperature [K]': process_temp,
        'Rotational speed [rpm]': rotational_speed,
        'Torque [Nm]': torque,
        'Tool wear [min]': tool_wear
    }
    
    return data