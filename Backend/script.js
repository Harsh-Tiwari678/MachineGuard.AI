// Fetch last 20 predictions from /history
async function loadHistory() {
    const response = await fetch("/history");
    const records = await response.json();

    const tbody = document.querySelector("#historyTable tbody");
    tbody.innerHTML = "";

    records.forEach(record => {
        const tr = document.createElement("tr");

        const timestamp = document.createElement("td");
        timestamp.textContent = new Date(record.timestamp).toLocaleString();
        tr.appendChild(timestamp);

        const status = document.createElement("td");
        status.textContent = record.status || "-";
        tr.appendChild(status);

        const prediction = document.createElement("td");
        prediction.textContent = record.prediction || "-";
        tr.appendChild(prediction);

        tbody.appendChild(tr);
    });
}

// Simulate new machine data
document.getElementById("simulateBtn").addEventListener("click", async () => {
    const response = await fetch("/simulate");
    const data = await response.json();

    // Update latest prediction card
    document.getElementById("machineName").textContent = data.name;
    document.getElementById("status").textContent = data.status;
    document.getElementById("prediction").textContent = data.prediction;

    // Reload history
    loadHistory();
});

// Load history on page load
loadHistory();
