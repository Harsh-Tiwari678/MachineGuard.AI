// isme frontend ko api se connect krke data fetch krke dashboard me show krna hai
const API_URL = 'http://localhost:5000';
const UPDATE_INTERVAL = 5000;

let chart = null;
let lastAlertCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Dashboard loaded');
    initializeChart();
    updateDashboard();
    setInterval(updateDashboard, UPDATE_INTERVAL);
    checkPathwayStatus();
    setInterval(checkPathwayStatus, 30000);
 //load ke baad 1.5 second ke delay se 3D machine animation initialize krna hai taki sab kuch load ho jaye
    setTimeout(() => {
        if (typeof THREE !== 'undefined') {
            init3DMachine();
        } else {
            console.error('THREE.js not loaded!');
        }
    }, 1500);

    // Assistant machine learning model se question puchne ke liye RAG input setup
    const ragInput = document.getElementById('ragInput');
    if (ragInput) {
        ragInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') askRAG();
        });
    }
});
//Dashboard ka staus update krne ke liye api se data fetch krke health score, metrics, status, chart, stats, alerts update krna hai
async function updateDashboard() {
    try {
        const latest = await fetchLatest();
        if (latest && Object.keys(latest).length > 0) {
            updateHealthScore(latest);
            updateMetrics(latest);
            updateStatus(latest);
        }

        const history = await fetchHistory();
        if (history && history.length > 0) {
            updateChart(history);
            updateStats(history);
            checkAlerts(history);
        }
    } catch (error) {
        console.error('Update error:', error);
    }
}

async function fetchLatest() {
    const response = await fetch(`${API_URL}/latest`);
    return await response.json();
}

async function fetchHistory() {
    const response = await fetch(`${API_URL}/history`);
    return await response.json();
}

async function checkPathwayStatus() {
    try {
        const response = await fetch(`${API_URL}/pathway-status`);
        const data = await response.json();
        const el = document.getElementById('pathwayStatus');
        if (!el) return;

        if (data.status === 'running') {
            el.innerHTML = '<i class="fas fa-check-circle" style="color: #10b981;"></i>';
        } else {
            el.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>';
        }
    } catch (error) {
        console.error('Status error:', error);
    }
}

// machine ki health dikhan eke liye health score calculate krke progress bar me show krna hai, aur color change krna hai according to health score
function updateHealthScore(data) {
    if (!data.failure_probability) return;

    const health = Math.round((1 - data.failure_probability) * 100);
    const el = document.getElementById('healthValue');
    if (el) el.textContent = health + '%';

    const circle = document.getElementById('progressCircle');
    if (circle) {
        const circ = 2 * Math.PI * 85;
        circle.style.strokeDashoffset = circ - (health / 100) * circ;
    }

    const stops = document.querySelectorAll('#healthGradient stop');
    if (stops.length >= 2) {
        if (health >= 70) {
            stops[0].setAttribute('style', 'stop-color:#10b981;stop-opacity:1');
            stops[1].setAttribute('style', 'stop-color:#059669;stop-opacity:1');
        } else if (health >= 40) {
            stops[0].setAttribute('style', 'stop-color:#f59e0b;stop-opacity:1');
            stops[1].setAttribute('style', 'stop-color:#d97706;stop-opacity:1');
        } else {
            stops[0].setAttribute('style', 'stop-color:#ef4444;stop-opacity:1');
            stops[1].setAttribute('style', 'stop-color:#dc2626;stop-opacity:1');
        }
    }
}

function updateMetrics(data) {
    const tempEl = document.getElementById('tempValue');
    const vibEl = document.getElementById('vibrationValue');
    const pressEl = document.getElementById('pressureValue');
    const rpmEl = document.getElementById('rpmValue');

    if (tempEl && data['Air temperature [K]']) {
        tempEl.textContent = data['Air temperature [K]'].toFixed(1) + '°K';
    }
    if (vibEl && data['Process temperature [K]']) {
        vibEl.textContent = data['Process temperature [K]'].toFixed(1);
    }
    if (pressEl && data['Torque [Nm]']) {
        pressEl.textContent = data['Torque [Nm]'].toFixed(1);
    }
    if (rpmEl && data['Rotational speed [rpm]']) {
        rpmEl.textContent = Math.round(data['Rotational speed [rpm]']);
    }
}


function updateStatus(data) {
    const textEl = document.getElementById('statusText');
    const riskEl = document.getElementById('riskLevel');

    if (textEl && data.prediction) {
        textEl.textContent = data.prediction;
    }
    if (riskEl && data.risk_level) {
        riskEl.textContent = data.risk_level;
        riskEl.style.color = data.risk_level === 'HIGH RISK' ? '#ef4444' :
            data.risk_level === 'MEDIUM RISK' ? '#f59e0b' : '#10b981';
    }
}


function initializeChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    chart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Failure Risk (%)',
                data: [],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: 'white' } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });
}

function updateChart(history) {
    if (!chart) return;

    const last10 = history.slice(-10);
    chart.data.labels = last10.map((_, i) => `#${i + 1}`);
    chart.data.datasets[0].data = last10.map(r =>
        r.failure_probability ? (r.failure_probability * 100).toFixed(1) : 0
    );
    chart.update('none');
}

function updateStats(history) {
  
    const totalEl = document.getElementById('totalRecords');
    if (totalEl) totalEl.textContent = history.length;

  
    const alertCountEl = document.getElementById('alertCount');
    if (alertCountEl) {
        const totalAlerts = history.filter(r => {
            const risk = (r.failure_probability || 0) * 100;
            return risk >= 15 || r.prediction === 'Machine Failure';
        }).length;
        alertCountEl.textContent = totalAlerts;
    }

    const healthyEl = document.getElementById('healthyCount');
    if (healthyEl) {
        const healthy = history.filter(r => {
            const risk = (r.failure_probability || 0) * 100;
            return risk < 15 && r.prediction === 'Machine Healthy';
        }).length;
        healthyEl.textContent = healthy;
    }
}

function checkAlerts(history) {
    const list = document.getElementById('alertsList');
    if (!list) return;

    console.log('Checking alerts from history:', history.length);

    const alerts = [];

    history.forEach(record => {
        const riskPercent = (record.failure_probability || 0) * 100;

        // LOWERED THRESHOLDS - Show alerts for ANY risk > 15%
        if (riskPercent >= 25) {
            // High risk (>25%)
            alerts.push({
                type: '🔴 HIGH RISK',
                message: `Failure Risk: ${riskPercent.toFixed(1)}%`,
                time: record.timestamp,
                color: '#ef4444'
            });
        } else if (riskPercent >= 15) {
            // Medium risk (15-25%)
            alerts.push({
                type: '🟡 MEDIUM RISK',
                message: `Warning: ${riskPercent.toFixed(1)}%`,
                time: record.timestamp,
                color: '#f59e0b'
            });
        }

        if (record.prediction === 'Machine Failure') {
            alerts.push({
                type: '⚠️ MACHINE FAILURE',
                message: 'Immediate action required!',
                time: record.timestamp,
                color: '#dc2626'
            });
        }
    });

    console.log('Total alerts found:', alerts.length);

    if (alerts.length > 0) {
        list.innerHTML = '';

        // Show last 5 alerts jada nahi dikhana hai taki dashboard clean rahe, aur latest alert upar dikhana hai
        alerts.slice(-5).reverse().forEach(alert => {
            const div = document.createElement('div');
            div.className = 'alert-item';
            div.style.borderLeftColor = alert.color;
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <strong style="color: ${alert.color};">${alert.type}</strong>
                        <p style="margin: 0.25rem 0 0; font-size: 0.875rem; opacity: 0.8;">
                            ${alert.message}
                        </p>
                    </div>
                    <small style="opacity: 0.6; white-space: nowrap;">
                        ${new Date(alert.time).toLocaleTimeString()}
                    </small>
                </div>
            `;
            list.appendChild(div);
        });

       
        document.getElementById('alertBadge').textContent = alerts.length;

       
        if (alerts.length > lastAlertCount) {
            showToast('🔴 NEW ALERT DETECTED!', 'critical');
        }
        lastAlertCount = alerts.length;

    } else {
        list.innerHTML = `
            <div class="alert-empty">
                <i class="fas fa-check-circle"></i>
                <p>No active alerts</p>
            </div>
        `;
        document.getElementById('alertBadge').textContent = '0';
    }
}
function showToast(msg, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}
// 3D machine ka dimag yaha ki kase load krna hai 3d me dikhane ke liye, aur usme gears ko rotate krna hai taki machine chalti hui lage, aur uske colors bhi change krne hai according to health score, aur usme light bhi add krna hai taki machine zyada realistic lage
let scene, camera, renderer, gears = [];

function init3DMachine() {
    const container = document.getElementById('machine-canvas');
    if (!container) {
        console.log('Container not found');
        return;
    }

    console.log('Creating 3D machine...');
    container.innerHTML = '';

    const width = container.clientWidth;
    const height = 350;


    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2332);

    
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 3, 7);
    camera.lookAt(0, 0, 0);

    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

   
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 10, 5);
    scene.add(light);

    const pointLight1 = new THREE.PointLight(0x60a5fa, 1.5);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x10b981, 1);
    pointLight2.position.set(-3, -2, 2);
    scene.add(pointLight2);

  
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 0.3, 32),
        new THREE.MeshPhongMaterial({ color: 0x334155 })
    );
    base.position.y = -1;
    scene.add(base);

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 2, 32),
        new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            metalness: 0.7,
            roughness: 0.2
        })
    );
    body.position.y = 0.5;
    scene.add(body);

 
    const gear1 = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.2, 16, 50),
        new THREE.MeshStandardMaterial({
            color: 0x60a5fa,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x2563eb,
            emissiveIntensity: 0.3
        })
    );
    gear1.position.y = 2;
    gear1.rotation.x = Math.PI / 2;
    scene.add(gear1);
    gears.push({ mesh: gear1, speed: 0.01 });

    const gear2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.1, 16, 50),
        new THREE.MeshStandardMaterial({
            color: 0x10b981,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x059669,
            emissiveIntensity: 0.3
        })
    );
    gear2.position.set(1.3, 2, 0);
    gear2.rotation.x = Math.PI / 2;
    scene.add(gear2);
    gears.push({ mesh: gear2, speed: -0.02 });

    const gear3 = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.08, 16, 50),
        new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0xd97706,
            emissiveIntensity: 0.3
        })
    );
    gear3.position.set(-1.2, 0.5, 0);
    gear3.rotation.x = Math.PI / 2;
    scene.add(gear3);
    gears.push({ mesh: gear3, speed: 0.025 });

    console.log('✅ 3D machine created!');

  
    function animate() {
        requestAnimationFrame(animate);
        gears.forEach(g => g.mesh.rotation.z += g.speed);
        renderer.render(scene, camera);
    }
    animate();
}

function resetCamera() {
    if (camera) {
        camera.position.set(0, 3, 7);
        camera.lookAt(0, 0, 0);
    }
}

async function askRAG() {
    const input = document.getElementById('ragInput');
    const question = input.value.trim();
    if (!question) return;

    const messagesDiv = document.getElementById('ragMessages');
    messagesDiv.innerHTML += `<div class="rag-message user"><strong>👤 You:</strong><br>${question}</div>`;
    input.value = '';

    try {
        const response = await fetch(`${API_URL}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });

        const data = await response.json();
        messagesDiv.innerHTML += `<div class="rag-message assistant"><strong>🤖 Assistant:</strong><br>${data.answer.replace(/\n/g, '<br>')}</div>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (error) {
        console.error('RAG error:', error);
    }
}