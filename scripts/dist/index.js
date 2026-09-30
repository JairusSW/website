"use strict";
const PHI = 0.618033;
const AXIS = 0.7237;
const panels = Array.from(document.querySelectorAll(".panel"));
const spiral = document.querySelector("#spiral");
const canvas = document.querySelector("#arcCanvas");
const currentNode = document.querySelector("#current");
const totalNode = document.querySelector("#total");
const labelNode = document.querySelector("#label");
const dotsNode = document.querySelector("#dots");
const edgeGreeting = document.querySelector("#edgeGreeting");
const detail = document.querySelector("#detail");
const detailEyebrow = document.querySelector("#detailEyebrow");
const detailTitle = document.querySelector("#detailTitle");
const detailDescription = document.querySelector("#detailDescription");
const detailLinks = document.querySelector("#detailLinks");
const detailGrid = document.querySelector("#detailGrid");
const detailClose = document.querySelector(".detail__close");
let rotation = 90;
let currentSection = 0;
let animationFrame = 0;
let snapTimer = 0;
let resizeTimer = 0;
let listMode = false;
let detailOpen = false;
let touchX = 0;
let touchY = 0;
let touchVelocity = 0;
function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}
function panelColor(panel, name) {
    return panel.dataset[name] || (name === "bg" ? "#efe8da" : "#1f2d3a");
}
function buildSpiral() {
    if (!spiral || listMode)
        return;
    const portrait = window.innerWidth < 960 && window.innerHeight > window.innerWidth;
    const originX = portrait ? window.innerWidth * (1 - AXIS) : window.innerWidth * AXIS;
    const originY = portrait ? (window.innerWidth / PHI) * AXIS : window.innerWidth * PHI * AXIS;
    const size = portrait ? window.innerWidth : window.innerWidth * PHI;
    const origin = `${Math.floor(originX)}px ${Math.floor(originY)}px`;
    spiral.style.transformOrigin = origin;
    panels.forEach((panel, index) => {
        panel.style.width = `${size}px`;
        panel.style.height = `${size}px`;
        panel.style.transformOrigin = origin;
        panel.style.transform = `rotate(${90 * index}deg) scale(${Math.pow(PHI, index)}) translate3d(0,0,0)`;
        panel.style.setProperty("--panel-bg", panelColor(panel, "bg"));
        panel.style.setProperty("--panel-fg", panelColor(panel, "fg"));
    });
    drawGuide();
    updateSpiral();
}
function drawGuide() {
    if (!canvas || listMode)
        return;
    const ratio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext("2d");
    if (!context)
        return;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);
    context.beginPath();
    const portrait = width < 960 && height > width;
    const centerX = portrait ? width * (1 - AXIS) : width * AXIS;
    const centerY = portrait ? (width / PHI) * AXIS : width * PHI * AXIS;
    const maxRadius = Math.max(width, height) * 1.15;
    for (let step = 0; step <= 260; step += 1) {
        const angle = -Math.PI * .2 + step * .055;
        const radius = maxRadius * Math.exp(-.19 * angle);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        if (step === 0)
            context.moveTo(x, y);
        else
            context.lineTo(x, y);
    }
    const active = panels[clamp(currentSection, 0, panels.length - 1)];
    context.strokeStyle = panelColor(active, "fg");
    context.lineWidth = 1.25;
    context.stroke();
}
function sectionFromRotation() {
    return Math.floor((rotation - 30) / -90);
}
function updateSpiral() {
    var _a;
    if (!spiral || listMode)
        return;
    const scale = Math.pow(PHI, rotation / 90);
    spiral.style.transform = `rotate(${rotation}deg) scale(${scale})`;
    const rawSection = sectionFromRotation();
    const nextSection = clamp(rawSection, 0, panels.length - 1);
    const sectionChanged = nextSection !== currentSection;
    currentSection = nextSection;
    const active = panels[currentSection];
    const background = panelColor(active, "bg");
    const foreground = panelColor(active, "fg");
    document.documentElement.style.setProperty("--active-bg", background);
    document.documentElement.style.setProperty("--active-fg", foreground);
    (_a = document.querySelector('meta[name="theme-color"]')) === null || _a === void 0 ? void 0 : _a.setAttribute("content", background);
    panels.forEach((panel, index) => {
        panel.classList.toggle("is-active", index === currentSection && rawSection >= 0 && rawSection < panels.length);
        panel.style.display = index < currentSection - 1 ? "none" : "block";
        panel.setAttribute("aria-hidden", index === currentSection ? "false" : "true");
    });
    if (currentNode)
        currentNode.textContent = rawSection < 0 || rawSection >= panels.length ? "LOST" : String(currentSection + 1);
    if (labelNode)
        labelNode.textContent = active.dataset.label || "Section";
    document.querySelectorAll(".progress__dots button").forEach((dot, index) => dot.classList.toggle("is-active", index === currentSection));
    const spiraling = rawSection < 0 || rawSection >= panels.length;
    document.body.classList.toggle("is-spiraling", spiraling);
    if (edgeGreeting) {
        edgeGreeting.textContent = rawSection < 0 ? "Hello." : "Goodbye.";
        edgeGreeting.classList.toggle("has-solid-shadow", rawSection >= panels.length);
    }
    spiral.style.pointerEvents = rawSection >= panels.length ? "none" : "auto";
    if (sectionChanged) {
        document.title = `${active.dataset.label || "Portfolio"} — Jairus Tanaka`;
        drawGuide();
    }
}
function animateTo(target, focus = false) {
    window.cancelAnimationFrame(animationFrame);
    const tick = () => {
        const distance = target - rotation;
        if (Math.abs(distance) <= .08) {
            rotation = target;
            updateSpiral();
            if (focus && target <= 0 && target >= (panels.length - 1) * -90) {
                panels[clamp(Math.round(target / -90), 0, panels.length - 1)].focus({ preventScroll: true });
            }
            return;
        }
        rotation += distance * .16;
        updateSpiral();
        animationFrame = window.requestAnimationFrame(tick);
    };
    tick();
}
function goTo(index, focus = false, allowEdge = false) {
    const minimum = allowEdge ? -1 : 0;
    const maximum = allowEdge ? panels.length : panels.length - 1;
    animateTo(clamp(index, minimum, maximum) * -90, focus);
}
function scheduleSnap() {
    window.clearTimeout(snapTimer);
    snapTimer = window.setTimeout(() => {
        const rawTarget = sectionFromRotation();
        if (rawTarget < 0 || rawTarget >= panels.length)
            return;
        const target = clamp(rawTarget, 0, panels.length - 1);
        animateTo(target * -90);
    }, 220);
}
function setListMode(enabled) {
    listMode = enabled;
    document.body.classList.toggle("list-mode", enabled);
    document.querySelectorAll("[data-mode]").forEach((button) => button.setAttribute("aria-pressed", String(enabled)));
    document.querySelectorAll("[data-mode-text]").forEach((node) => { node.textContent = enabled ? "Less" : "More"; });
    panels.forEach((panel) => {
        panel.style.display = "block";
        panel.setAttribute("aria-hidden", "false");
    });
    if (!enabled)
        buildSpiral();
}
function openDetail(panel) {
    var _a, _b, _c, _d, _e, _f;
    if (!detail || !detailTitle || !detailDescription || !detailLinks || !detailGrid)
        return;
    detailOpen = true;
    const projectType = (_b = (_a = panel.querySelector(".panel__meta span")) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim();
    if (detailEyebrow)
        detailEyebrow.textContent = projectType || "Project";
    detailTitle.textContent = panel.dataset.label || "Project";
    detailDescription.textContent = panel.dataset.summary || ((_d = (_c = panel.querySelector(".panel__description")) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || "";
    detailLinks.innerHTML = ((_e = panel.querySelector(".links")) === null || _e === void 0 ? void 0 : _e.innerHTML) || "";
    detailGrid.innerHTML = "";
    const fallbackHighlights = (panel.dataset.tags || "Build|Measure|Refine|Ship").split("|").map((tag) => `${tag}::A defining part of the project.`);
    (((_f = panel.dataset.highlights) === null || _f === void 0 ? void 0 : _f.split("|")) || fallbackHighlights).slice(0, 4).forEach((highlight, index) => {
        const [title, description = ""] = highlight.split("::");
        const tile = document.createElement("div");
        tile.className = "detail__tile";
        const number = document.createElement("span");
        number.className = "detail__index";
        number.textContent = index < 9 ? `0${index + 1}` : String(index + 1);
        const copy = document.createElement("div");
        const heading = document.createElement("h3");
        const body = document.createElement("p");
        heading.textContent = title;
        body.textContent = description;
        copy.append(heading, body);
        tile.append(number, copy);
        detailGrid.appendChild(tile);
    });
    detail.hidden = false;
    document.body.classList.add("is-detail");
    window.requestAnimationFrame(() => detail.classList.add("is-open"));
    detailClose === null || detailClose === void 0 ? void 0 : detailClose.focus();
}
function closeDetail() {
    if (!detail)
        return;
    detailOpen = false;
    detail.classList.remove("is-open");
    detail.hidden = true;
    document.body.classList.remove("is-detail");
    panels[currentSection].focus({ preventScroll: true });
}
function makeDots() {
    if (!dotsNode)
        return;
    dotsNode.innerHTML = "";
    panels.forEach((panel, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = index === 0 ? "is-active" : "";
        button.setAttribute("aria-label", `Go to ${panel.dataset.label || `section ${index + 1}`}`);
        button.addEventListener("click", () => goTo(index, true));
        dotsNode.appendChild(button);
    });
}
if (totalNode)
    totalNode.textContent = String(panels.length);
makeDots();
buildSpiral();
window.setTimeout(() => document.body.classList.add("is-ready"), 850);
window.addEventListener("wheel", (event) => {
    if (listMode || detailOpen)
        return;
    event.preventDefault();
    window.cancelAnimationFrame(animationFrame);
    rotation -= clamp(event.deltaY / 6, -10, 10);
    rotation = clamp(rotation, -90 * (panels.length + 2), 180);
    updateSpiral();
    scheduleSnap();
}, { passive: false });
window.addEventListener("touchstart", (event) => {
    if (listMode || detailOpen)
        return;
    const touch = event.touches[0];
    if (!touch)
        return;
    touchX = touch.clientX;
    touchY = touch.clientY;
    touchVelocity = 0;
    window.cancelAnimationFrame(animationFrame);
}, { passive: true });
window.addEventListener("touchmove", (event) => {
    if (listMode || detailOpen)
        return;
    const touch = event.touches[0];
    if (!touch)
        return;
    event.preventDefault();
    const movement = (touchY - touch.clientY) + (touchX - touch.clientX) / 2;
    touchVelocity = movement;
    rotation -= movement / 3.5;
    rotation = clamp(rotation, -90 * (panels.length + 2), 180);
    touchX = touch.clientX;
    touchY = touch.clientY;
    updateSpiral();
}, { passive: false });
window.addEventListener("touchend", () => {
    if (listMode || detailOpen)
        return;
    const section = sectionFromRotation();
    const target = touchVelocity > 8 ? section + 1 : touchVelocity < -8 ? section - 1 : section;
    goTo(target, false, true);
}, { passive: true });
window.addEventListener("keydown", (event) => {
    if (detailOpen) {
        if (event.key === "Escape")
            closeDetail();
        return;
    }
    if (listMode)
        return;
    if (["ArrowRight", "ArrowDown", "PageDown", " "].indexOf(event.key) !== -1) {
        event.preventDefault();
        goTo(sectionFromRotation() + 1, true, true);
    }
    else if (["ArrowLeft", "ArrowUp", "PageUp"].indexOf(event.key) !== -1) {
        event.preventDefault();
        goTo(sectionFromRotation() - 1, true, true);
    }
    else if (event.key === "Home") {
        event.preventDefault();
        goTo(0, true);
    }
    else if (event.key === "End") {
        event.preventDefault();
        goTo(panels.length - 1, true);
    }
});
document.querySelectorAll("[data-next]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); goTo(sectionFromRotation() + 1, true, true); }));
document.querySelectorAll("[data-prev]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); goTo(sectionFromRotation() - 1, true, true); }));
document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); setListMode(!listMode); }));
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); const panel = button.closest(".panel"); if (panel === null || panel === void 0 ? void 0 : panel.classList.contains("is-active"))
    openDetail(panel); }));
panels.forEach((panel, index) => panel.addEventListener("click", (event) => {
    if (listMode || event.target.closest("a, button"))
        return;
    goTo(index, true);
}));
detailClose === null || detailClose === void 0 ? void 0 : detailClose.addEventListener("click", closeDetail);
detail === null || detail === void 0 ? void 0 : detail.addEventListener("click", (event) => { if (event.target === detail)
    closeDetail(); });
canvas === null || canvas === void 0 ? void 0 : canvas.addEventListener("click", () => { if (document.body.classList.contains("is-spiraling"))
    goTo(0, true); });
window.addEventListener("mousemove", (event) => {
    if (!detailOpen || !detailClose || window.innerWidth < 960)
        return;
    detailClose.style.transform = `translate3d(${event.clientX - window.innerWidth + 32}px, ${event.clientY - 32}px, 0)`;
});
window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildSpiral, 100);
});
