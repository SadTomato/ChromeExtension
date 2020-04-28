(() => {
    /**
     * Tests event on typical automation indicators.
     * @param event
     * @returns {Promise<boolean>}
     */
    async function isTrustworthfull(event) {
        return (
            event.isTrusted &&
            !/HeadlessChrome/.test(navigator.userAgent) &&
            !navigator.webdriver &&
            !!window.chrome &&
            (navigator.languages?.length ?? 0) > 0
        )
    }

    /**
     * Handles navigation and tests it on trustworthiness
     * @param event
     * @returns {Promise<void>}
     */
    async function onNavigation(event) {
        if (isTrustworthfull(event)) {
            alert("I trust you!");
        }
    }

    /**
     * Finds "a" tag with specific href
     * @param url
     * @returns {*}
     */
    function getURLElement(url) {
        try {
            return document.querySelector(`a[href="${url}"]`);
        } catch (e) {
            return null;
        }
    }

    /**
     * Tests equality of expected query and google search query
     * @param query
     * @returns {boolean}
     */
    function queryIsValid(query) {
        const encodedQuery = location.search
            .replace(/^\?/, "")
            .split("&")
            .find(p => p.startsWith("q="))
            ?.replace(/^q=/, "");

        return !!query && !!encodedQuery && query === decodeURI(encodedQuery);
    }

    /**
     * Highlights element with cyan background color
     * @param element
     */
    function highlightElement(element) {
        element.parentNode.parentNode.style.background = "rgba(0, 255, 255, 0.2)";
    }

    /**
     * Removes element highlighting
     * @see highlightElement
     * @param element
     */
    function removeHighlighting(element) {
        element.parentNode.parentNode.style.background = null;
    }

    /**
     * Adds event listener on element if element exists and query is valid
     * @param key
     * @param url
     */
    function setEventHandlers(key, url) {
        if (queryIsValid(key)) {
            const urlElement = getURLElement(url);
            if (urlElement) {
                urlElement.addEventListener("click", onNavigation);
                highlightElement(urlElement);
            }
        }
    }

    /**
     * Promise wrapper for chrome.storage.local.get
     * @param keys
     * @returns {Promise<any>}
     */
    function getStorageValues(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, (result) => {
                resolve(keys.map(k => result[k]));
            });
        });
    }

    /**
     * Cleans old URL element and adds event listener on new element
     * @param oldURL
     * @param newURL
     */
    function reinitiateListeners(oldURL, newURL) {
        const oldElement = getURLElement(oldURL);
        if (oldElement) {
            oldElement.removeEventListener("click", onNavigation);
            removeHighlighting(oldElement);
        }

        const newElement = getURLElement(newURL);
        if (newElement) {
            newElement.addEventListener("click", onNavigation);
            highlightElement(newElement);
        }
    }

    chrome.storage.onChanged.addListener(async (changes) => {
        if ("url" in changes) {
            let key = "key" in changes ?
                changes["key"].newValue :
                (await getStorageValues(["key"]))[0];

            if (queryIsValid(key)) {
                reinitiateListeners(changes["url"].oldValue, changes["url"].newValue);
            }
        } else {
            if ("key" in changes) {
                const url = (await getStorageValues(["url"]))[0];
                const urlElement = getURLElement(url);
                if (!urlElement) {
                    return;
                }
                if (queryIsValid(changes["key"].newValue)) {
                    urlElement.addEventListener("click", onNavigation);
                    highlightElement(urlElement);
                } else {
                    urlElement.removeEventListener("click", onNavigation);
                    removeHighlighting(urlElement);
                }
            }
        }
    });

    getStorageValues(["key", "url"]).then(values => {
        setEventHandlers(values[0], values[1]);
    });
})();
