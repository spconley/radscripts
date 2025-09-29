// ==UserScript==
// @name         M3U8 Link Copier
// @version      1.0.0
// @description  Detects .m3u8 video links on a page and lets you copy them easily.
// @author       Redacted
// @match        https://*.top/*
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @downloadURL  https://raw.githubusercontent.com/spconley/radscripts/refs/heads/main/m3u8_link_copier.js
// ==/UserScript==

(function() {
    'use strict';

    let proxyUrl = GM_getValue("proxyUrl", null);

    GM_registerMenuCommand("Set Proxy URL", () => {
        const newProxyUrl = prompt("Proxy URL:", proxyUrl);
        if (newProxyUrl) {
            GM_setValue("proxyUrl", newProxyUrl);
            proxyUrl = newProxyUrl;
            alert("Proxy URL updated to " + newProxyUrl);
        }
    });

    // --- UI setup ---
    const panel = document.createElement("div");
    panel.style.position = "fixed";
    panel.style.top = "10px";
    panel.style.right = "10px";
    panel.style.zIndex = "999999";
    panel.style.background = "rgba(0,0,0,0.8)";
    panel.style.color = "#fff";
    panel.style.padding = "8px";
    panel.style.borderRadius = "6px";
    panel.style.fontSize = "12px";
    panel.style.maxWidth = "250px";
    panel.style.maxHeight = "200px";
    panel.style.overflowY = "auto";
    panel.style.display = "none";
    panel.innerHTML = "<b>M3U8 Links</b><br/>";
    document.body.appendChild(panel);

    // --- Copy helper ---
    function copyText(text) {
        if (typeof GM_setClipboard !== "undefined") {
            GM_setClipboard(text);
        } else {
            navigator.clipboard.writeText(text);
        }
    }

    // --- Track found links ---
    const foundLinks = new Set();

    function addLink(url) {
        if (null !== proxyUrl) {
            url = `${proxyUrl}${url}`
        }
        if (foundLinks.has(url)) return;
        foundLinks.add(url);

        // Show panel on first detection
        if (panel.style.display === "none") {
            panel.style.display = "block";
        }

        const btn = document.createElement("button");
        btn.textContent = "Copy M3U8";
        btn.style.display = "block";
        btn.style.margin = "4px 0";
        btn.style.width = "100%";
        btn.style.cursor = "pointer";
        btn.onclick = () => copyText(url);

        const label = document.createElement("div");
        label.textContent = url;
        label.style.wordBreak = "break-all";
        label.style.fontSize = "10px";
        label.style.marginBottom = "2px";

        panel.appendChild(label);
        panel.appendChild(btn);
    }

    // --- Detection logic ---
    function checkContent(url, text) {
        if (text.includes("#EXTM3U")) {
            addLink(url);
        }
    }

    // Hook fetch
    const origFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await origFetch.apply(this, args);
        try {
            const clone = response.clone();
            clone.text().then(text => checkContent(response.url, text));
        } catch (e) {}
        return response;
    };

    // Hook XHR
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this.addEventListener("load", function() {
            try {
                if (this.responseText) {
                    checkContent(url, this.responseText);
                }
            } catch (e) {}
        });
        return origOpen.apply(this, arguments);
    };
})();
