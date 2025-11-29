import { Terminal, Typewriter } from './libs.js';


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


document.addEventListener('DOMContentLoaded', () => {
    new Typewriter(
        "#typewriter-text",
        POSSIBLE_DESCRIPTIONS,
        ANIMATION_MILLISECONDS + PAUSE_MILLISECONDS
    );
    new Terminal("#terminal");
});
