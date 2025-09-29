// ==UserScript==
// @name         Copy Quicken Simplifi Token
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Copy localStorage token value to clipboard
// @author       Redacted
// @match        https://simplifi.quicken.com/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @downloadURL  https://raw.githubusercontent.com/spconley/radscripts/refs/heads/main/copy_simplifi_token.js
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle ( `
        #copyTokenBtn {
            opacity: 1; /* Initially visible */
            animation: hideElement 0.5s forwards; /* Animation duration for hiding */
            animation-delay: 5s; /* Delay before the animation starts */
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
})();
