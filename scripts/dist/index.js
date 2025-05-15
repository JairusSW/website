"use strict";
const height = window.innerHeight;
const width = window.innerWidth;
class Page {
    constructor(node) {
        this.height = 0;
        this.width = 0;
        this.x = 0;
        this.y = 0;
        this.node = node;
    }
}
class PageManager {
    constructor() {
        this.pages = [];
        this.startTime = 0;
    }
    addPage(page) {
        this.pages.push(page);
    }
    drawPages() {
        console.log("Drawing pages!");
        const pages = this.calcPositions();
        for (const page of pages) {
            const el = page.node;
            if (!el) {
                console.log("Could not find element");
                continue;
            }
            el.style.left = `${page.x}px`;
            el.style.top = `${page.y}px`;
            el.style.width = `${page.width}px`;
            el.style.height = `${page.height}px`;
        }
        this.drawCurve();
    }
    calcPositions() {
        let fib = [0, 1];
        let i = 2;
        while (true) {
            const val = fib[i - 1] + fib[i - 2];
            if (val + fib[i - 1] >= width)
                break;
            fib[i] = val;
            i++;
        }
        const boxA = fib[fib.length - 1];
        const boxB = fib[fib.length - 2];
        const totalWidth = boxA + boxB;
        const scaleX = (width - 40) / totalWidth;
        const scaleY = (height - 40) / boxA;
        fib = fib.reverse();
        const directions = [
            [1, 0], // right
            [0, 1], // down
            [-1, 0], // left
            [0, -1], // up
        ];
        let dirIndex = -1;
        let x = 20;
        let y = 20;
        let prevX = fib[0] * scaleX;
        let prevY = fib[0] * scaleY;
        const end = this.pages.length - 1;
        for (let i = 0; i < end; i++) {
            const sizeX = fib[i] * scaleX;
            const sizeY = fib[i] * scaleY;
            const page = this.pages[i];
            page.width = sizeX;
            page.height = sizeY;
            if (dirIndex >= 0) {
                const [dx, dy] = directions[dirIndex % 4];
                x += dx * prevX;
                y += dy * prevY;
                if (dirIndex == 0) {
                    // x -= prevX - sizeX;
                }
                else if (dirIndex == 1) {
                    x += prevX - sizeX;
                }
                else if (dirIndex == 2) {
                    x += prevX - sizeX;
                    y += prevY - sizeY;
                }
                else if (dirIndex == 3) {
                    y += prevY - sizeY;
                }
            }
            if (dirIndex >= 3)
                dirIndex = -1;
            dirIndex++;
            page.x = x;
            page.y = y;
            prevX = sizeX;
            prevY = sizeY;
        }
        const sizeX = prevX;
        const sizeY = this.pages[end - 2].height - prevY;
        const page = this.pages[end];
        page.width = sizeX;
        page.height = sizeY;
        if (dirIndex >= 0) {
            const [dx, dy] = directions[dirIndex % 4];
            x += dx * prevX;
            y += dy * prevY;
            if (dirIndex == 0) {
                // x -= prevX - sizeX;
            }
            else if (dirIndex == 1) {
                x += prevX - sizeX;
            }
            else if (dirIndex == 2) {
                x += prevX - sizeX;
                y += prevY - sizeY;
            }
            else if (dirIndex == 3) {
                y += prevY - sizeY;
            }
        }
        if (dirIndex >= 3)
            dirIndex = -1;
        dirIndex++;
        page.x = x;
        page.y = y;
        return this.pages;
    }
    drawCurve() {
        const canvas = document.getElementById("arcCanvas");
        if (!canvas)
            return;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        const duration = 2000; // Animation duration in milliseconds (2 seconds)
        this.startTime = 0;
        // This function captures the exact original path generation logic from your code
        const drawFullPath = () => {
            const directions = [
                [[0, 1], [1, 0]], // bottom-left to top-right
                [[0, 0], [1, 1]], // top-left to bottom-right
                [[1, 0], [0, 1]], // top-right to bottom-left
                [[1, 1], [0, 0]] // bottom-right to top-left
            ];
            // Offset direction for control points (bulge direction)
            const curveOffsets = [
                [-1, -1], // bulge to top-left
                [1, -1], // bulge to top-right
                [1, 1], // bulge to bottom-right
                [-1, 1] // bulge to bottom-left
            ];
            let dirIndex = 0;
            // Create a path object that we can use for drawing
            const path = new Path2D();
            // Store all the points, control points, and commands for later animation
            const commands = [];
            for (let i = 0; i < this.pages.length; i++) {
                const p = this.pages[i];
                const [ds, de] = directions[dirIndex % 4];
                const [ox, oy] = curveOffsets[dirIndex % 4];
                const startX = p.x + (ds[0] * p.width);
                const startY = p.y + (ds[1] * p.height);
                const endX = p.x + (de[0] * p.width);
                const endY = p.y + (de[1] * p.height);
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                const controlX = midX + (ox * (p.width / 2));
                const controlY = midY + (oy * (p.height / 2));
                // For the first point, we use moveTo
                if (i === 0) {
                    path.moveTo(startX, startY);
                    commands.push({ type: 'moveTo', points: [startX, startY] });
                }
                // Draw the curve
                path.quadraticCurveTo(controlX, controlY, endX, endY);
                commands.push({ type: 'quadraticCurveTo', points: [controlX, controlY, endX, endY] });
                dirIndex++;
            }
            return { path, commands };
        };
        // Get the full path and its commands
        const { path, commands } = drawFullPath();
        // Measure total path length (approximate)
        const totalCommands = commands.length;
        const pointsPerCommand = commands.reduce((sum, cmd) => {
            return sum + (cmd.type === 'quadraticCurveTo' ? 1 : 0);
        }, 0);
        // Animation function
        const animate = (timestamp) => {
            if (!this.startTime)
                this.startTime = timestamp;
            const elapsed = timestamp - this.startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Clear the canvas
            ctx.clearRect(0, 0, width, height);
            // Start a new path
            ctx.beginPath();
            // Get position in the command list
            const commandPosition = progress * totalCommands;
            const completeCommands = Math.floor(commandPosition);
            const partialCommandProgress = commandPosition - completeCommands;
            // Execute all complete commands
            for (let i = 0; i < completeCommands; i++) {
                const cmd = commands[i];
                if (cmd.type === 'moveTo') {
                    ctx.moveTo(cmd.points[0], cmd.points[1]);
                }
                else if (cmd.type === 'quadraticCurveTo') {
                    ctx.quadraticCurveTo(cmd.points[0], cmd.points[1], cmd.points[2], cmd.points[3]);
                }
            }
            // Draw partial last command if not at the end
            if (completeCommands < commands.length && partialCommandProgress > 0) {
                const lastCmd = commands[completeCommands];
                if (lastCmd.type === 'moveTo') {
                    ctx.moveTo(lastCmd.points[0], lastCmd.points[1]);
                }
                else if (lastCmd.type === 'quadraticCurveTo') {
                    // For quadratic curve, calculate the point along the curve
                    const t = partialCommandProgress;
                    const mt = 1 - t;
                    // Get the current point (where we are now)
                    const previousCmd = commands[completeCommands - 1];
                    let currentX = 0, currentY = 0;
                    if (previousCmd.type === 'moveTo') {
                        currentX = previousCmd.points[0];
                        currentY = previousCmd.points[1];
                    }
                    else {
                        currentX = previousCmd.points[2]; // End X of previous quadratic curve
                        currentY = previousCmd.points[3]; // End Y of previous quadratic curve
                    }
                    // Control point from current command
                    const controlX = lastCmd.points[0];
                    const controlY = lastCmd.points[1];
                    // End point from current command
                    const endX = lastCmd.points[2];
                    const endY = lastCmd.points[3];
                    // Calculate point along the curve
                    const pointX = Math.pow(1 - t, 2) * currentX +
                        2 * (1 - t) * t * controlX +
                        Math.pow(t, 2) * endX;
                    const pointY = Math.pow(1 - t, 2) * currentY +
                        2 * (1 - t) * t * controlY +
                        Math.pow(t, 2) * endY;
                    // Draw up to this intermediate point
                    ctx.quadraticCurveTo(controlX, controlY, pointX, pointY);
                }
            }
            // Set line style
            ctx.strokeStyle = "#111111";
            ctx.lineWidth = 2;
            ctx.stroke();
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        // Start the animation
        requestAnimationFrame(animate);
    }
}
onload = () => {
    console.log("Loaded");
    const pages = [
        new Page(document.getElementById("page1")),
        new Page(document.getElementById("page2")),
        new Page(document.getElementById("page3")),
        new Page(document.getElementById("page4")),
        new Page(document.getElementById("page5")),
        new Page(document.getElementById("page6")),
        new Page(document.getElementById("page7")),
        // new Page(document.getElementById("page8")),
        // new Page(document.getElementById("page9")),
    ];
    const man = new PageManager();
    man.pages = pages;
    man.drawPages();
};
