const script = document.createElement("script");
script.src = chrome.runtime.getURL("sniffer.js");
(document.head || document.documentElement).appendChild(script);
script.remove();

window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "API_DETECTED") {
        try {
            chrome.runtime.sendMessage(event.data, () => {
                if (chrome.runtime.lastError) {}
            });
        } catch (e) {}
    }
});
