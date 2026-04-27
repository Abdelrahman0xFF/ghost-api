let allLogs = [];
const container = document.getElementById("container");
const searchInput = document.getElementById("search");
const clearBtn = document.getElementById("clear-btn");

function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "API_DETECTED") {
        const logEntry = {
            ...msg,
            timestamp: new Date().toLocaleTimeString(),
            id: Date.now() + Math.random().toString(36).substring(2),
        };

        allLogs.unshift(logEntry);
        if (allLogs.length > 100) allLogs.pop();
        render();
    }
});

function render() {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = allLogs.filter(
        (log) =>
            (log.url && log.url.toLowerCase().includes(searchTerm)) ||
            (log.payload &&
                JSON.stringify(log.payload).toLowerCase().includes(searchTerm)),
    );

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>No matching requests found.</p></div>`;
        return;
    }

    container.innerHTML = filtered
        .map(
            (log) => `
    <div class="log-item" id="log-${log.id}">
      <div class="log-header">
        <span class="badge ${escapeHTML(log.method)}">${escapeHTML(log.method)}</span>
        <span class="url" title="${escapeHTML(log.url)}">${escapeHTML(log.url)}</span>
        <span style="font-size: 9px; color: #8b949e;">${escapeHTML(log.timestamp)}</span>
      </div>
      ${
          log.payload
              ? `
        <div class="payload-section">
          <div class="payload-header">
            <span>Payload (${escapeHTML(log.payload.__type || "JSON")})</span>
            <span class="copy-link" data-id="${log.id}">Copy JSON</span>
          </div>
          <pre id="pre-${log.id}">${escapeHTML(JSON.stringify(log.payload, null, 2))}</pre>
        </div>
      `
              : ""
      }
    </div>
  `,
        )
        .join("");
}

container.addEventListener("click", (e) => {
    if (e.target.classList.contains("copy-link")) {
        const id = e.target.getAttribute("data-id");
        const textElement = document.getElementById(`pre-${id}`);
        if (!textElement) return;
        
        navigator.clipboard.writeText(textElement.innerText).then(() => {
            const originalText = e.target.innerText;
            e.target.innerText = "Copied!";
            e.target.style.color = "#3fb950";
            setTimeout(() => {
                e.target.innerText = originalText;
                e.target.style.color = "";
            }, 2000);
        }).catch(err => console.error("Failed to copy", err));
    }
});

searchInput.addEventListener("input", render);

clearBtn.onclick = () => {
    allLogs = [];
    render();
};
