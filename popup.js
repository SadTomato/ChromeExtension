(() => {
    function storeValue(key, value, callback) {
        chrome.storage.local.set(
            {
                [key]: value
            },
            callback
        );
    }

    function initiateField(name, value) {
        const field = document.querySelector(`#${name}`);
        field.value = value;
        field.addEventListener("input", event => {
            storeValue(name, event.target.value);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        chrome.storage.local.get(["key", "url"], (result) => {
            initiateField("key", result.key ?? "");
            initiateField("url", result.url ?? "");
        });
    });
})();