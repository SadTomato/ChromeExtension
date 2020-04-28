(() => {
    function storeValue(key, value, callback) {
        chrome.storage.local.set(
            {
                [key]: value
            },
            callback
        );
    }

    /**
     * Checks domain and returns search query
     * @returns {Promise<any>}
     */
    function getCurrentQuery() {
        return new Promise(resolve => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                const [domain, search] = tabs[0].url.split("?");
                if (domain === "https://www.google.com/search") {
                    resolve(
                        decodeURI(search)
                            .split("&")
                            .find(p => p.startsWith("q="))
                            ?.replace(/^q=/, "")
                    )
                } else {
                    resolve(undefined);
                }
            });
        });
    }

    function initiateKeyStatus(key) {
        // Initiating key statu
        getCurrentQuery().then(query => {
            const keyStatus = document.querySelector(`#keyStatus`);
            if (keyStatus) {
                keyStatus.innerText = "Key Status: " + (query === key.replace(/ /g, "+")).toString()
            }
        });
    }

    function initiateField(name, value) {
        const field = document.querySelector(`#${name}`);
        field.value = value;
        field.addEventListener("input", event => {
            storeValue(name, event.target.value);
        });
        return field;
    }

    document.addEventListener("DOMContentLoaded", () => {
        chrome.storage.local.get(["key", "url", "lastClick"], (result) => {
            const key = result.key ?? "";
            const url = result.url ?? "";
            initiateField("key", key)
                .addEventListener("input", event => {
                    initiateKeyStatus(event.target.value);
                });
            initiateField("url", url);
            initiateKeyStatus(key);

            // Initiating "google it" button
            document.querySelector(`#google`)
                ?.addEventListener("click", () => {
                    chrome.tabs.create(
                        {
                            url: `https://www.google.com/search?q=${document.querySelector(`#key`).value}`
                        }
                    );
                });

            // Initiation last click status
            const clickDiv = document.querySelector(`#result`);
            clickDiv.innerText = result.lastClick ?
                `${result.lastClick.isTrusted ? "Trusted" : "Not trusted"} click at ${result.lastClick.date}` :
                "No clicks yet";
        });
    });
})();