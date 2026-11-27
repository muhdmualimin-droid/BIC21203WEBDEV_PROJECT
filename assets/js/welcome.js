
"use strict";

/* ============================================================
   BELANG RAIL — AUTO WELCOME ANNOUNCEMENT
   Minimal Speaker Control + Autoplay Fallback
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const audio = document.getElementById("welcomeAudio");
    const button = document.getElementById("welcomeAudioToggle");
    const icon = document.getElementById("welcomeAudioIcon");
    const status = document.getElementById("welcomeAudioStatus");

    if (!audio || !button || !icon || !status) {
        return;
    }

    // Comfortable station announcement volume.
    audio.volume = 0.6;

    function updateButton(playing) {
        icon.textContent = playing ? "🔊" : "🔈";

        const label = playing
            ? "Stop welcome announcement"
            : "Play welcome announcement";

        button.setAttribute("aria-label", label);
        button.setAttribute("aria-pressed", String(playing));
        button.title = label;
    }

    async function playWelcome() {
        try {
            await audio.play();

            updateButton(true);
            status.textContent =
                "Welcome announcement playing.";

        } catch (error) {
            updateButton(false);

            if (error.name === "NotAllowedError") {
                status.textContent =
                    "Autoplay blocked. Press the speaker button to play.";
            } else {
                status.textContent =
                    "Unable to play welcome announcement.";
            }
        }
    }

    function stopWelcome() {
        audio.pause();
        audio.currentTime = 0;

        updateButton(false);
        status.textContent =
            "Welcome announcement stopped.";
    }

    // Small speaker button: Play / Stop.
    button.addEventListener("click", () => {
        if (audio.paused) {
            audio.currentTime = 0;
            playWelcome();
        } else {
            stopWelcome();
        }
    });

    audio.addEventListener("play", () => {
        updateButton(true);
    });

    audio.addEventListener("pause", () => {
        updateButton(false);
    });

    audio.addEventListener("ended", () => {
        updateButton(false);
        status.textContent =
            "Welcome announcement completed.";
    });

    audio.addEventListener("error", () => {
        updateButton(false);
        status.textContent =
            "Audio file unavailable. Check belang_welcome.mp3.";
    });

    // Attempt autoplay immediately on Homepage load.
    // Browser permission is still required.
    updateButton(!audio.paused);

    if (audio.paused) {
        playWelcome();
    }
});
