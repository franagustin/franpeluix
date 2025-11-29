export class Typewriter {
    constructor(selector, texts, interval) {
        this.element = document.querySelector(selector);
        this.texts = texts;
        this.interval = interval;
        this.currentIndex = 0;
        this.currentTimeout = null;

        this.setText(this.texts[0]);
        this.scheduleNext();
    }

    setText(text) {
        this.element.textContent = text;
        this.element.style.setProperty("--chars", text.length);
        this.element.style.animation = "none";
        // Force the browser to flush style changes and restart animation
        void this.element.offsetWidth;
        this.element.style.removeProperty("animation");
    }

    scheduleNext() {
        if (this.currentTimeout) clearTimeout(this.currentTimeout);

        this.currentTimeout = setTimeout(() => {
            this.currentIndex = (this.currentIndex + 1) % this.texts.length;
            this.setText(this.texts[this.currentIndex]);
            this.scheduleNext();
        }, this.interval);
    }
}


export class Terminal {
    constructor(selector, maxLines = 30) {
        this.element = document.querySelector(selector);
        // Bind the onKeyDown so we can use this.currenInput inside it.
        // It MUST be bind BEFORE calling setup, or we will attach an unbound listener.
        this.onKeyDown = this.onKeyDown.bind(this);
        this.maxLines = maxLines;
        this.setup();
        this.lineCount = 0;
    }

    setup() {
        this.element.classList.add("terminal");
        this.element.innerHTML = `
            <div class="terminal-navbar">Terminal</div>
            <div class="terminal-body">
            </div>
        `;
        this.addNewLine("help");
    }

    addNewLine(text = "") {
        if (this.lineCount >= this.maxLines) return;
        this.lineCount++;
        this.element.querySelector(".terminal-body").insertAdjacentHTML("beforeend", `
            <div class="terminal-input">
                <p class="prompt">&gt;&nbsp;</p>
                <p contenteditable="true" class="terminal-input-editable">${text}</p>
            </div>
        `);

        const inputs = this.element.querySelectorAll(".terminal-input-editable");
        this.currentInput = inputs[inputs.length - 1];
        this.currentInput.addEventListener("keydown", this.onKeyDown);
        this.currentInput.focus();
        this.setCursorToEnd(this.currentInput);
        this.currentInput.scrollIntoView({behavior: "smooth", block: "nearest"})
    }

    onKeyDown(e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (this.lineCount >= this.maxLines) return;
        this.currentInput.contentEditable = false;
        this.currentInput.removeEventListener("keydown", this.onKeyDown);
        this.currentInput.classList.remove("terminal-input-editable");
        this.addNewLine();
    }

    setCursorToEnd(element) {
        const range = document.createRange();
        const selection = window.getSelection();

        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
