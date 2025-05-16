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
        const scaleX = width / totalWidth;
        const scaleY = height / boxA;
        fib = fib.reverse();
        const directions = [
            [1, 0], // right
            [0, 1], // down
            [-1, 0], // left
            [0, -1], // up
        ];
        let dirIndex = -1;
        let x = 0;
        let y = 0;
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
        const directions = [
            [[0, 1], [1, 0]], // bottom-left to top-right
            [[0, 0], [1, 1]], // top-left to bottom-right
            [[1, 0], [0, 1]], // top-right to bottom-left
            [[1, 1], [0, 0]] // bottom-right to top-left
        ];
        const curveOffsets = [
            [-1, -1], // bulge to top-left
            [1, -1], // bulge to top-right
            [1, 1], // bulge to bottom-right
            [-1, 1] // bulge to bottom-left
        ];
        let dirIndex = 0;
        ctx.beginPath();
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
            if (i === 0) {
                ctx.moveTo(startX, startY);
            }
            ctx.quadraticCurveTo(controlX, controlY, endX, endY);
            dirIndex++;
        }
        ctx.strokeStyle = "#222222";
        ctx.lineWidth = 2;
        ctx.stroke();
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
