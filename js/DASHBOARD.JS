// ===== API CONFIGURATION =====
const API_URL = 'http://localhost:5000/api';
let chart;
let updateInterval;

// ===== INITIALIZE DASHBOARD =====
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    init3DScene();
    startDataFetch();
});

// ===== START DATA FETCHING =====
function startDataFetch() {
    fetchLatestData(); // Initial fetch
    updateInterval = setInterval(fetchLatestData, 1000); // Update every second
}

// ===== FETCH LATEST DATA FROM API =====
async function fetchLatestData() {
    try {
        // For demo purposes, generate mock data
        // Replace this with actual API call: const response = await fetch(`${API_URL}/latest`);
        const data = generateMockData();
        updateDashboard(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Connection error. Using simulated data.', 'warning');
    }
}

// ===== GENERATE MOCK DATA (SIMULATED) =====
function generateMockData() {
    const temp = (Math.random() * 40 + 60).toFixed(2);
    const vibration = (Math.random() * 10).toFixed(2);
    const pressure = (Math.random() * 40 + 80).toFixed(2);
    const rpm = Math.floor(Math.random() * 2000 + 1000);

    // Calculate health score
    let health = 100;
    if (temp > 85) health -= 30;
    if (vibration > 7) health -= 40;
    if (pressure > 110) health -= 20;

    const status = health > 70 ? 'Healthy' : health > 40 ? 'Warning' : 'Critical';
    const alerts = [];
    
    if (temp > 85) alerts.push('High Temperature Detected!');
    if (vibration > 7) alerts.push('Abnormal Vibration!');
    if (pressure > 110) alerts.push('Pressure Exceeded Threshold!');

    return {
        timestamp: new Date().toISOString(),
        temperature: parseFloat(temp),
        vibration: parseFloat(vibration),
        pressure: parseFloat(pressure),
        rpm: rpm,
        health_score: Math.max(0, health),
        status: status,
        alerts: alerts,
        predicted_failure_hours: Math.max(0, (health - 20) / 10).toFixed(1)
    };
}

// ===== UPDATE DASHBOARD =====
function updateDashboard(data) {
    // Update health score
    updateHealthScore(data.health_score);
    
    // Update status badge
    updateStatus(data.status);
    
    // Update failure prediction
    document.getElementById('failureTime').textContent = 
        data.predicted_failure_hours > 0 ? `${data.predicted_failure_hours} hours` : 'N/A';
    
    // Update metrics
    updateMetric('temp', data.temperature, '°C');
    updateMetric('vibration', data.vibration, ' Hz');
    updateMetric('pressure', data.pressure, ' PSI');
    updateMetric('rpm', data.rpm, ' RPM');
    
    // Update alerts
    updateAlerts(data.alerts);
    
    // Update chart
    updateChart(data);
    
    // Update 3D visualization color
    update3DVisualization(data.status);
    
    // Show toast on critical status
    if (data.status === 'Critical' && data.alerts.length > 0) {
        showToast(data.alerts[0], 'critical');
    }
}

// ===== UPDATE HEALTH SCORE =====
function updateHealthScore(score) {
    const progressCircle = document.getElementById('progressCircle');
    const healthValue = document.getElementById('healthValue');
    
    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (score / 100) * circumference;
    
    progressCircle.style.strokeDashoffset = offset;
    
    // Animate number
    animateNumber(healthValue, score);
    
    // Change color based on score
    if (score > 70) {
        progressCircle.style.stroke = '#10b981';
    } else if (score > 40) {
        progressCircle.style.stroke = '#f59e0b';
    } else {
        progressCircle.style.stroke = '#ef4444';
    }
}

// ===== UPDATE STATUS BADGE =====
function updateStatus(status) {
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    
    statusBadge.className = 'status-badge';
    statusBadge.classList.add(`status-${status.toLowerCase()}`);
    statusText.textContent = status;
}

// ===== UPDATE METRIC =====
function updateMetric(id, value, unit) {
    const element = document.getElementById(`${id}Value`);
    if (element) {
        element.textContent = value + unit;
    }
}

// ===== UPDATE ALERTS =====
function updateAlerts(alerts) {
    const alertsList = document.getElementById('alertsList');
    
    if (alerts.length === 0) {
        alertsList.innerHTML = `
            <div class="alert-empty">
                <i class="fas fa-check-circle"></i>
                <p>No active alerts</p>
            </div>
        `;
    } else {
        alertsList.innerHTML = alerts.map(alert => `
            <div class="alert-item">
                <i class="fas fa-exclamation-triangle"></i>
                ${alert}
            </div>
        `).join('');
    }
}

// ===== INITIALIZE CHART =====
function initDashboard() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Vibration (Hz)',
                    data: [],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Pressure (PSI)',
                    data: [],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'white' }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

// ===== UPDATE CHART =====
function updateChart(data) {
    if (!chart) return;

    const time = new Date(data.timestamp).toLocaleTimeString();
    
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(data.temperature);
    chart.data.datasets[1].data.push(data.vibration);
    chart.data.datasets[2].data.push(data.pressure);

    // Keep only last 50 data points
    if (chart.data.labels.length > 50) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(dataset => dataset.data.shift());
    }

    chart.update('none'); // Update without animation for smooth real-time
}

// ===== ANIMATE NUMBER =====
function animateNumber(element, target) {
    const current = parseInt(element.textContent) || 0;
    const step = (target - current) / 10;
    let count = 0;

    const timer = setInterval(() => {
        count++;
        const value = Math.round(current + step * count);
        element.textContent = value;
        
        if (count >= 10) {
            element.textContent = Math.round(target);
            clearInterval(timer);
        }
    }, 50);
}

// ===== SHOW TOAST NOTIFICATION =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// ===== 3D VISUALIZATION =====
let machineScene, machineCamera, machineRenderer, machineGroup;
let mainMotor, pistons = [], gears = [], pipes = [];

function init3DScene() {
    const canvas = document.getElementById('machine-canvas');
    if (!canvas) return;

    machineScene = new THREE.Scene();
    machineCamera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    machineRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    machineRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
    machineRenderer.setClearColor(0x000000, 0);
    canvas.appendChild(machineRenderer.domElement);

    machineGroup = new THREE.Group();

    // ===== MAIN MOTOR HOUSING =====
    const housingGeometry = new THREE.CylinderGeometry(2, 2.2, 4, 32);
    const housingMaterial = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x10b981,
        emissiveIntensity: 0.3
    });
    mainMotor = new THREE.Mesh(housingGeometry, housingMaterial);
    mainMotor.rotation.z = Math.PI / 2;
    machineGroup.add(mainMotor);

    // ===== COOLING FINS =====
    for (let i = 0; i < 8; i++) {
        const finGeometry = new THREE.BoxGeometry(0.1, 2.4, 0.4);
        const finMaterial = new THREE.MeshStandardMaterial({
            color: 0x334155,
            metalness: 0.8,
            roughness: 0.3
        });
        const fin = new THREE.Mesh(finGeometry, finMaterial);
        const angle = (Math.PI * 2 / 8) * i;
        fin.position.set(Math.cos(angle) * 2.1, Math.sin(angle) * 2.1, 0);
        fin.rotation.z = angle;
        machineGroup.add(fin);
    }

    // ===== PISTONS (Animated) =====
    for (let i = 0; i < 3; i++) {
        const pistonGroup = new THREE.Group();
        
        const cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16);
        const cylinderMaterial = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            metalness: 0.9,
            roughness: 0.1
        });
        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        
        const rodGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
        const rod = new THREE.Mesh(rodGeometry, cylinderMaterial);
        rod.position.y = -1.25;
        
        pistonGroup.add(cylinder);
        pistonGroup.add(rod);
        pistonGroup.position.set(-2.5, i * 1.5 - 1.5, 0);
        pistonGroup.rotation.z = Math.PI / 2;
        
        pistons.push({ group: pistonGroup, phase: i * Math.PI / 3 });
        machineGroup.add(pistonGroup);
    }

    // ===== ROTATING GEARS =====
    for (let i = 0; i < 2; i++) {
        const gearGroup = new THREE.Group();
        
        // Gear teeth
        for (let j = 0; j < 12; j++) {
            const toothGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
            const toothMaterial = new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                metalness: 1,
                roughness: 0.2
            });
            const tooth = new THREE.Mesh(toothGeometry, toothMaterial);
            const angle = (Math.PI * 2 / 12) * j;
            tooth.position.set(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 0);
            tooth.rotation.z = angle;
            gearGroup.add(tooth);
        }
        
        // Gear center
        const centerGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.3, 32);
        const center = new THREE.Mesh(centerGeometry, new THREE.MeshStandardMaterial({
            color: 0x475569,
            metalness: 0.9,
            roughness: 0.2
        }));
        center.rotation.x = Math.PI / 2;
        gearGroup.add(center);
        
        gearGroup.position.set(2.5, i * 1.5 - 0.75, 0);
        gears.push(gearGroup);
        machineGroup.add(gearGroup);
    }

    // ===== PIPES/HOSES =====
    const pipePositions = [
        { start: [-2, 2, 0], end: [2, 2.5, 0] },
        { start: [-2, -2, 0], end: [2, -2.5, 0] }
    ];

    pipePositions.forEach(pos => {
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(...pos.start),
            new THREE.Vector3(0, pos.start[1] + 1, 0),
            new THREE.Vector3(...pos.end)
        );
        
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.15, 8, false);
        const tubeMaterial = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            metalness: 0.7,
            roughness: 0.3
        });
        const pipe = new THREE.Mesh(tubeGeometry, tubeMaterial);
        pipes.push(pipe);
        machineGroup.add(pipe);
    });

    // ===== CONTROL PANEL =====
    const panelGeometry = new THREE.BoxGeometry(1.5, 1, 0.2);
    const panelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.5,
        roughness: 0.5
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(0, 3, 0);
    machineGroup.add(panel);

    // Indicator lights on panel
    const indicatorColors = [0xff0000, 0xffff00, 0x00ff00];
    indicatorColors.forEach((color, i) => {
        const lightGeometry = new THREE.CircleGeometry(0.1, 16);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 1
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(-0.5 + i * 0.5, 3, 0.11);
        machineGroup.add(light);
    });

    // ===== MOUNTING BASE =====
    const baseGeometry = new THREE.BoxGeometry(6, 0.5, 3);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.6,
        roughness: 0.4
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -2.5;
    machineGroup.add(base);

    machineScene.add(machineGroup);

    // ===== LIGHTING =====
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    machineScene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(10, 10, 10);
    mainLight.castShadow = true;
    machineScene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.5);
    fillLight.position.set(-5, 5, -5);
    machineScene.add(fillLight);

    const spotLight = new THREE.SpotLight(0x8b5cf6, 1, 50, Math.PI / 6);
    spotLight.position.set(0, 10, 5);
    machineScene.add(spotLight);

    machineCamera.position.set(8, 4, 8);
    machineCamera.lookAt(0, 0, 0);

    // Mouse interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            machineGroup.rotation.y += deltaX * 0.01;
            machineGroup.rotation.x += deltaY * 0.01;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mouseleave', () => isDragging = false);

    animate3D();
}

function animate3D() {
    requestAnimationFrame(animate3D);
    
    const time = Date.now() * 0.001;
    
    // Rotate main motor
    if (mainMotor) {
        mainMotor.rotation.x += 0.01;
    }
    
    // Animate pistons
    pistons.forEach((piston, i) => {
        const offset = Math.sin(time * 2 + piston.phase) * 0.3;
        piston.group.position.x = -2.5 + offset;
    });
    
    // Rotate gears
    gears.forEach((gear, i) => {
        gear.rotation.z += (i % 2 === 0 ? 0.02 : -0.02);
    });
    
    machineRenderer.render(machineScene, machineCamera);
}

function update3DVisualization(status) {
    if (!mainMotor) return;

    let color, emissiveColor, emissiveIntensity;

    switch (status) {
        case 'Healthy':
            color = 0x10b981;
            emissiveColor = 0x10b981;
            emissiveIntensity = 0.3;
            break;
        case 'Warning':
            color = 0xf59e0b;
            emissiveColor = 0xf59e0b;
            emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;
            break;
        case 'Critical':
            color = 0xef4444;
            emissiveColor = 0xef4444;
            emissiveIntensity = 0.8 + Math.sin(Date.now() * 0.006) * 0.2;
            break;
    }

    mainMotor.material.color.lerp(new THREE.Color(color), 0.1);
    mainMotor.material.emissive.lerp(new THREE.Color(emissiveColor), 0.1);
    mainMotor.material.emissiveIntensity = emissiveIntensity;
}

function resetCamera() {
    if (machineCamera && machineGroup) {
        machineCamera.position.set(8, 4, 8);
        machineCamera.lookAt(0, 0, 0);
        machineGroup.rotation.set(0, 0, 0);
    }
}

    // Create machine (simple cylinder + box)
    const bodyGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        metalness: 0.7,
        roughness: 0.3
    });
    machineMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    machineScene.add(machineMesh);

    // Add top piece
    const topGeometry = new THREE.BoxGeometry(2, 0.5, 2);
    const topMesh = new THREE.Mesh(topGeometry, bodyMaterial);
    topMesh.position.y = 1.75;
    machineScene.add(topMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    machineScene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    machineScene.add(pointLight);

    machineCamera.position.z = 6;
    machineCamera.position.y = 2;

    animate3D();

    // Handle resize
    window.addEventListener('resize', () => {
        machineCamera.aspect = canvas.clientWidth / canvas.clientHeight;
        machineCamera.updateProjectionMatrix();
        machineRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });


function animate3D() {
    requestAnimationFrame(animate3D);
    
    if (machineMesh) {
        machineMesh.rotation.y += 0.005;
    }
    
    machineRenderer.render(machineScene, machineCamera);
}

function update3DVisualization(status) {
    if (!machineMesh) return;

    let color;
    switch (status) {
        case 'Healthy':
            color = 0x10b981;
            break;
        case 'Warning':
            color = 0xf59e0b;
            break;
        case 'Critical':
            color = 0xef4444;
            break;
        default:
            color = 0x60a5fa;
    }

    machineMesh.material.color.setHex(color);
}

function resetCamera() {
    if (machineCamera) {
        machineCamera.position.set(0, 2, 6);
        machineCamera.lookAt(0, 0, 0);
    }
}

// ===== CLEANUP ON PAGE UNLOAD =====
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});