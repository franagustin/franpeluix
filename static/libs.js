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
    constructor(selector, fileSystem, maxLines = 30) {
        this.element = document.querySelector(selector);
        // Bind the onKeyDown so we can use this.currenInput inside it.
        // It MUST be bind BEFORE calling setup, or we will attach an unbound listener.
        this.onKeyDown = this.onKeyDown.bind(this);
        this.maxLines = maxLines;
        this.setup();
        this.lineCount = 0;
        this.fileSystem = fileSystem;
    }

    setup(reset = false) {
        this.element.classList.add("terminal");
        this.element.innerHTML = `
            <div class="terminal-navbar">Terminal</div>
            <div class="terminal-body">
            </div>
        `;
        this.addNewLine(reset ? "" : "help");
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

    async onKeyDown(e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (this.lineCount >= this.maxLines) return;
        this.currentInput.contentEditable = false;
        this.currentInput.removeEventListener("keydown", this.onKeyDown);
        this.currentInput.classList.remove("terminal-input-editable");
        await this.execute(this.currentInput.textContent.trim())
    }

    setCursorToEnd(element) {
        const range = document.createRange();
        const selection = window.getSelection();

        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    print(text, escape = true, preserveWhitespace = false) {
        this.element.querySelector(".terminal-body").insertAdjacentHTML("beforeend", `
            <div class="terminal-output">
                <p
                    class='${preserveWhitespace ? "preserve-whitespace" : ""}'
                >${escape ? this.escapeHTML(text) : text}</p>
            </div>
        `);
    }

    escapeHTML(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async execute(line) {
        const [command, ...args] = line.split(" ");
        let addNewLine = true;
        switch (command) {
            case "cat":
                await this.command_cat(args[0]);
                break;
            case "cd":
                this.command_cd(args[0]);
                break;
            case "clear":
                this.setup(true);
                addNewLine = false;
                break;
            case "help":
                this.command_help();
                break;
            case "ls":
                this.command_ls(args[0]);
                break;
            default:
                this.print(`Command not found: ${command}.`);
                this.command_help();
        }
        if (addNewLine) this.addNewLine();
    }

    async command_cat(filepath) {
        let text;
        try {
            const fileContents = await this.fileSystem.getFileContents(filepath);
            text = fileContents;
        } catch (e) {
            text = e.message || String(e);
        }
        this.print(text, true, true);
    }

    command_cd(folder) {
        try {
            this.fileSystem.changeWorkingDirectory(folder);
        } catch(e) {
            this.print(e.message || String(e));
        }
    }

    command_help() {
        this.print("Available commands: cat, cd, clear, help, ls");
    }

    command_ls(node) {
        const nodes = [];
        try {
            const entry = this.fileSystem.list(node).value;
            if (entry.directories) {
                Object.keys(entry.directories).forEach(
                    d => nodes.push(`<span class="directory">${this.escapeHTML(d)}/</span>`),
                );
            }
            entry.files.forEach(f => nodes.push(
                `<span class="file">${this.escapeHTML(f)}</span>`),
            );
        } catch(e) {
            nodes.push(e.message || String(e))
        }
        this.print(nodes.join("\n"), false);
    }
}


export class FileSystem {
    constructor(files, folderSplitter = "/") {
        this.files = files;
        this.folderSplitter = folderSplitter;
        this.cwd = "";
    }

    changeWorkingDirectory(newDirectory) {
        const newPath = this.getFullPath(newDirectory);
        const entry = this.list(newPath);
        if (entry.type === "file") {
            throw new Error(`Can only cd into a folder. ${newDirectory} is a file`);
        }
        this.cwd = newPath;
    }

    list(directory) {
        const full = directory && directory.startsWith("/") ? directory : this.getFullPath(directory);
        const parts = full.split(this.folderSplitter);
        let node = this.files;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!node.directories || !(part in node.directories)) {
                throw new Error(`Path not found: ${full}`);
            }
            node = node.directories[part];
        }

        const last = parts[parts.length - 1];
        if (!last) return {type: "directory", value: node};
        if (node.directories && last in node.directories) {
            return {type: "directory", value: node.directories[last]};
        }
        if (node.files && node.files.includes(last)) {
            return {type: "file", value: {"files": [last]}};
        }

        throw new Error(`Path not found: ${full}`);
    }

    getFullPath(path) {
        if (path === "..") {
            return this.cwd.split(this.folderSplitter).slice(0, -1).join(this.folderSplitter);
        }
        if (!path) return this.cwd;
        if (path.startsWith(this.folderSplitter)) return path;
        const combined = this.cwd ? `${this.cwd}${this.folderSplitter}${path}` : path;
        const splitterRegex = new RegExp(`${this.folderSplitter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}+`, 'g');
        return combined.replace(splitterRegex, this.folderSplitter);
    }

    async getFileContents(filepath) {
        const full = this.getFullPath(filepath);
        const node = this.list(filepath);
        if (node.type === "directory") {
            throw new Error(`${full} is a directory. You can only read files.`);
        }
        const response = await fetch(`/static/files/${full}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`File not found: ${full}`);
            }
            throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
        }

        return await response.text();
    }
}
