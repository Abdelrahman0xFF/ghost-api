(function () {
    const parseBody = (body) => {
        if (!body) return null;
        try {
            if (typeof body === "string") {
                try {
                    return JSON.parse(body);
                } catch (e) {
                    return body;
                }
            }
            if (body instanceof FormData) {
                const data = { __type: "FormData" };
                for (let [key, value] of body.entries()) {
                    data[key] =
                        value instanceof File ? `[File: ${value.name}]` : value;
                }
                return data;
            }
            if (body instanceof URLSearchParams) {
                return {
                    __type: "URLSearchParams",
                    ...Object.fromEntries(body.entries()),
                };
            }
            return body.toString();
        } catch (e) {
            return "[Unparseable Data]";
        }
    };

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const [resource, config] = args;
        const url = typeof resource === "string" ? resource : resource.url;

        window.postMessage(
            {
                type: "API_DETECTED",
                method: config?.method || "GET",
                url: url,
                payload: parseBody(config?.body),
            },
            "*",
        );

        return originalFetch(...args);
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        this._method = method;
        this._url = url;
        return originalOpen.apply(this, arguments);
    };

    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body) {
        this.addEventListener("load", () => {
            window.postMessage(
                {
                    type: "API_DETECTED",
                    method: this._method,
                    url: this._url,
                    payload: parseBody(body),
                },
                "*",
            );
        });
        return originalSend.apply(this, arguments);
    };
})();
