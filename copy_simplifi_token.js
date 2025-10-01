// ==UserScript==
// @name         Copy Quicken Simplifi Token
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Copy localStorage token value to clipboard
// @author       Redacted
// @match        https://simplifi.quicken.com/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @downloadURL  https://raw.githubusercontent.com/spconley/radscripts/refs/heads/main/copy_simplifi_token.js
// ==/UserScript==

(function() {
    'use strict';

    // Menu for optional settings, only used if calling split script
    // Split script is an arbitrary script, called via webhook, used to split transactions on a certain account
    // This is useful for shared credit cards, though this usescript just passes the current auth token to said script for background execution
    // The split script is not published anywhere at this time
    let splitScriptUrl = GM_getValue("splitScriptUrl", null);
    GM_registerMenuCommand("Set Split Script URL", () => {
        const newSplitScriptUrl = prompt("Proxy URL:", splitScriptUrl);
        if (newSplitScriptUrl) {
            GM_setValue("splitScriptUrl", newSplitScriptUrl);
            splitScriptUrl = newSplitScriptUrl;
            alert("Split Script URL updated to " + newSplitScriptUrl);
        }
    });

    let webhookApiKey = GM_getValue("webhookApiKey", null);
    GM_registerMenuCommand("Set Webhook API Key", () => {
        const newWebhookApiKey = prompt("Webhook API Key:", webhookApiKey);
        if (newWebhookApiKey) {
            GM_setValue("webhookApiKey", newWebhookApiKey);
            webhookApiKey = newWebhookApiKey;
            alert("Webhook API Key updated to " + newWebhookApiKey);
        }
    });

    GM_addStyle ( `
        #copyTokenBtn, #splitScriptButton {
            opacity: 1; /* Initially visible */
            animation: hideElement 0.5s forwards; /* Animation duration for hiding */
            animation-delay: 10s; /* Delay before the animation starts */
        }

        @keyframes hideElement {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
                visibility: hidden; /* Removes the element from layout after fading */
            }
        }
    ` );

    // Create the button
    const btn = document.createElement("button");
    btn.id = "copyTokenBtn";
    btn.innerText = "Copy Auth Token";
    btn.style.position = "fixed";
    btn.style.top = "10px";
    btn.style.right = "10px";
    btn.style.zIndex = "9999";
    btn.style.padding = "6px 10px";
    btn.style.background = "#0078d7";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "12px";

    // Add click event
    btn.addEventListener("click", () => {
        const token = JSON.parse(localStorage.getItem("authSession")).accessToken;
        if (token) {
            // Use Tampermonkey's clipboard API if available
            if (typeof GM_setClipboard !== "undefined") {
                GM_setClipboard(token);
            } else {
                // Fallback: use navigator.clipboard
                navigator.clipboard.writeText(token).catch(err => {
                    alert("Clipboard copy failed: " + err);
                });
            }
            alert("Auth token copied to clipboard!");
        } else {
            alert("No authSession key found in localStorage.");
        }
    });

    // Add button to page
    document.body.appendChild(btn);

    // Create the split script button
    if (splitScriptUrl && webhookApiKey) {
        const btnSplit = document.createElement("button");
        btnSplit.id = "splitScriptButton";
        btnSplit.innerText = "Run split script";
        btnSplit.style.position = "fixed";
        btnSplit.style.top = "50px";
        btnSplit.style.right = "10px";
        btnSplit.style.zIndex = "9999";
        btnSplit.style.padding = "6px 10px";
        btnSplit.style.background = "#0078d7";
        btnSplit.style.color = "#fff";
        btnSplit.style.border = "none";
        btnSplit.style.borderRadius = "4px";
        btnSplit.style.cursor = "pointer";
        btnSplit.style.fontSize = "12px";

        // Add click event
        btnSplit.addEventListener("click", () => {
            const token = JSON.parse(localStorage.getItem("authSession")).accessToken;
            if (token) {
                // Use Tampermonkey's clipboard API if available
                GM_xmlhttpRequest({
                    method: "POST",
                    url: splitScriptUrl,
                    data: JSON.stringify({
                        "token": token,
                        "dry": false
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-Key": webhookApiKey
                    },
                    onload: function(response) {
                        alert("Split success");
                        console.info("Receieved response from split script:", response.responseText);
                    },
                    onerror: function(error) {
                        alert("Split failed");
                        console.error("Request failed:", error);
                    }
                });
            } else {
                alert("No authSession key found in localStorage.");
            }
        });

        // Add button to page
        document.body.appendChild(btnSplit);
    }
})();
