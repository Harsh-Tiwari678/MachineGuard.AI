
setInterval(async () => {
    await simulateData();
}, 120000); // 2 minutes

document.getElementById("simulateBtn").addEventListener("click", async () => {
    await simulateData();
});

async function simulateData() {
    try {
        await fetch("/simulate");
        await loadLatest();
        await loadHistory();
    } catch (err) {
        console.error("Error simulating data:", err);
    }
}


async function loadLatest() {
    try {
        const response = await fetch("/latest");
        const data = await response.json();

        if (data) {
            document.getElementById("machineName").textContent = data.name || "Machine 1";
            document.getElementById("status").textContent = data.status || "-";
            document.getElementById("prediction").textContent = data.prediction || "-";
        }
    } catch (err) {
        console.error("Error loading latest data:", err);
    }
}


let trendChart; 

async function loadHistory() {
    try {
        const response = await fetch("/history");
        const records = await response.json();

        
        const tbody = document.querySelector("#historyTable tbody");
        tbody.innerHTML = "";

        records.forEach(record => {
            const tr = document.createElement("tr");

            const timestamp = new Date(record.timestamp);
            const istTime = timestamp.toLocaleString('en-GB', {
                timeZone: 'Asia/Kolkata',
                hour12: false,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            tr.innerHTML = `
                <td>${istTime}</td>
                <td>${record.status || "-"}</td>
                <td>${record.prediction || "-"}</td>
            `;

            tbody.appendChild(tr);
        });

       
        const last10 = records.slice(-10);
        const labels = last10.map((r, i) => i + 1);
        const values = last10.map(r => r.prediction === "Machine Failure" ? 1 : 0);

        const ctx = document.getElementById("trendChart").getContext("2d");

        if (trendChart) {
            trendChart.data.labels = labels;
            trendChart.data.datasets[0].data = values;
            trendChart.update();
        } else {
            trendChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Failure (1) / Healthy (0)",
                        data: values,
                        borderColor: "red",
                        backgroundColor: "rgba(255,0,0,0.2)",
                        borderWidth: 2,
                        tension: 0.2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true }
                    },
                    scales: {
                        y: { min: 0, max: 1, ticks: { stepSize: 1 } }
                    }
                }
            });
        }

    } catch (err) {
        console.error("Error loading history:", err);
    }
}


window.onload = async () => {
    await loadLatest();
    await loadHistory();
   
    await simulateData();
};
