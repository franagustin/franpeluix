import { FileSystem, Terminal, Typewriter } from './libs.js';


const POSSIBLE_DESCRIPTIONS = Object.freeze([
    "a curious tech enthusiast 🧑‍💻",
    "a passionate software developer 🧑‍💻",
    "a lifelong learner 📚",
    "an out-of-the-box thinker 💡",
    "an intrepid solutions designer 🧑‍🎨",
    "an avid turn-based RPG fan 🧝",
    'an insatiable "mate" drinker 🧉',
    "a casual chats over beers enjoyer 🍻",
    "an in-making game developer 🎮",
]);
const ANIMATION_MILLISECONDS = 3000;
const PAUSE_MILLISECONDS = 1000;


function initTheme() {
    let theme = localStorage.getItem("theme") ?? "dark";
    updateTheme(theme);
}

function toggleTheme() {
    document.documentElement.classList.toggle("light-theme");
    const theme = document.documentElement.classList.contains("light-theme") ? "light" : "dark";
    localStorage.setItem("theme", theme);
    updateTheme(theme);
}

function updateTheme(theme) {
    localStorage.setItem("theme", theme);
    const themeButton = document.getElementById("theme-toggle-button");
    if (theme === "light") {
        document.documentElement.classList.add("light-theme");
        themeButton.innerText = "🌛";
    } else {
        document.documentElement.classList.remove("light-theme");
        themeButton.innerText = "☀️";
    }
}


async function init() {
    initTheme();
    document.getElementById("theme-toggle-button").addEventListener("click", toggleTheme);
    new Typewriter(
        "#typewriter-text",
        POSSIBLE_DESCRIPTIONS,
        ANIMATION_MILLISECONDS + PAUSE_MILLISECONDS
    );

    let files;
    try {
        const filesResponse = await fetch("/static/files/index.json");
        if (!filesResponse.ok) {
            throw new Error(`Failed to load terminal files: ${filesResponse.status}`);
        }
        files = JSON.parse(await filesResponse.text());
    } catch (error) {
        console.error("Failed to load files index:", error);
        files = [];
    }
    new Terminal("#terminal", new FileSystem(files));
}


document.addEventListener('DOMContentLoaded', init);
