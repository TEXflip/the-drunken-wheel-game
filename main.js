let mouse = {
    x: 0,
    y: 0,
    down: false
};
let angle_velocity = 0, angle = 0, last_time = 0;

const SVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
let margin = 0.15;
SVG.setAttribute("viewBox", `-${1 + margin} -${1 + margin} ${2 + margin * 2} ${2 + margin * 2}`);
SVG.addEventListener('pointerdown', onPointerDown);
SVG.addEventListener('pointermove', onPointerMove);
SVG.addEventListener('pointerup', onPointerUp);
SVG.addEventListener('pointercancel', () => pointerTracker.clear());
SVG.svgToScreen = function (p) {
    if (!Array.isArray(p[0])) {
        const pt = SVG.createSVGPoint();
        pt.x = p[0];
        pt.y = p[1];
        return pt.matrixTransform(SVG.getScreenCTM());
    }
    let points = p;
    for (let i = 0; i < points.length; i++) {
        points[i] = SVG.svgToScreen(points[i]);
    }
    return points;
};
document.getElementById("wheel").appendChild(SVG);

const wheel_0 = document.createElementNS("http://www.w3.org/2000/svg", "g");
const choices = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const selector_collision = selector_collision_points();
let debug_points = [];
const pins = [];

class debug_canvas {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.style.position = "fixed";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext("2d");
        document.getElementById("wheel").appendChild(this.canvas);
        this.selector_collision_triangle = selector_collision_points();
        this.lines = [];

        let angle = Math.PI / 2;
        let scale = 100;
        let translation = [1000, 1000];
        let cosA = Math.cos(angle), sinA = Math.sin(angle);
        let rototranslation_matrix = [
            [scale * cosA, -scale * sinA, translation[0]],
            [scale * sinA,  scale * cosA, translation[1]],
            [0,             0,            1]
        ];
        for (let i = 0; i < 3; i++) {
            let p0 = debug_points[i];
            let p1 = debug_points[(i + 1) % 3];
            // let p0_t = transform_point(p0, rototranslation_matrix);
            // let p1_t = transform_point(p1, rototranslation_matrix);
            this.lines.push([p0, p1]);
        }
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 2;
        for (let line of this.lines) {
            this.ctx.beginPath();
            this.ctx.moveTo(line[0].x, line[0].y);
            this.ctx.lineTo(line[1].x, line[1].y);
            this.ctx.stroke();
        }
    }
}

function create_selector(position = [1.04, 0], scale = 0.05, rotation = Math.PI / 2) {
    const selector_group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const selector_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const p0 = [-0.8660254, 0.5];
    const p1 = [0.8660254, 0.5];
    const p2 = [0, 2];
    const points = [p0, p1, p2];
    const cosA = Math.cos(rotation);
    const sinA = Math.sin(rotation);
    const rototranslation_matrix = [
        [scale * cosA, -scale * sinA, position[0]],
        [scale * sinA,  scale * cosA, position[1]]
    ];
    const points_t = points.map(p => transform_point(p, rototranslation_matrix));
    selector_path.setAttribute("d", `M ${points_t[0][0]} ${points_t[0][1]} A ${scale} ${scale} 0 1 1 ${points_t[1][0]} ${points_t[1][1]} L ${points_t[2][0]} ${points_t[2][1]} Z`);
    selector_path.setAttribute("fill", "white");
    selector_path.setAttribute("stroke", "black");
    selector_path.setAttribute("stroke-width", "0.005");

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", `${position[0]}`);
    circle.setAttribute("cy", `${position[1]}`);
    circle.setAttribute("r", `${scale*0.3}`);
    circle.setAttribute("fill", "black");

    selector_group.appendChild(selector_path);
    selector_group.appendChild(circle);

    return [selector_group, points_t];
}

function create_wheel_svg(parent) {
    const color_palette = ["#e45a57", "#a27cb9", "#f48ca3", "#19ad78", "#f37430", "#54afdf", "#faeb25"];
    const angle_size = (2 * Math.PI) / choices.length;
    const internal_radius = 0.1;
    const text_radius = 0.9; // between internal_radius and 1

    for (let i = 0; i < choices.length; i++) {
        // create arc path
        const x0 = Math.cos(i * angle_size) * internal_radius;
        const y0 = Math.sin(i * angle_size) * internal_radius;
        const x1 = Math.cos((i + 1) * angle_size) * internal_radius;
        const y1 = Math.sin((i + 1) * angle_size) * internal_radius;
        const x2 = Math.cos((i + 1) * angle_size);
        const y2 = Math.sin((i + 1) * angle_size);
        const x3 = Math.cos(i * angle_size);
        const y3 = Math.sin(i * angle_size);
        const path_str = `M ${x0} ${y0} A ${internal_radius} ${internal_radius} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A 1 1 0 0 0 ${x3} ${y3} Z`;

        const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arc.setAttribute("d", path_str);
        arc.setAttribute("fill", color_palette[i % color_palette.length]);
        arc.setAttribute("stroke", "white");
        arc.setAttribute("stroke-width", "0.002");
        wheel_0.appendChild(arc);

        // add text
        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        const text_angle = (i + 0.5) * angle_size;
        const tx = Math.cos(text_angle) * text_radius;
        const ty = Math.sin(text_angle) * text_radius;
        const angle_deg = text_angle * 180 / Math.PI;
        text.setAttribute("x", tx);
        text.setAttribute("y", ty);
        text.classList.add("wheel");
        text.setAttribute("fill", "white");
        text.setAttribute("font-size", "0.08");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("alignment-baseline", "middle");
        text.setAttribute("transform", `rotate(${angle_deg} ${tx} ${ty})`);
        text.textContent = choices[i];
        wheel_0.appendChild(text);

    }

    // add pins
    const pin_radius = 0.96;
    for (let i = 0; i < choices.length; i++) {
        const x = Math.cos(i * angle_size) * pin_radius;
        const y = Math.sin(i * angle_size) * pin_radius;
        const pin = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pin.setAttribute("cx", x);
        pin.setAttribute("cy", y);
        pin.setAttribute("r", "0.02");
        pin.setAttribute("fill", "white");
        pin.setAttribute("stroke", "black");
        pin.setAttribute("stroke-width", "0.002");
        wheel_0.appendChild(pin);
        pins.push(pin);
    }

    const [selector_group, points_t] = create_selector();
    debug_points = SVG.svgToScreen(points_t);

    parent.appendChild(wheel_0);
    parent.appendChild(selector_group); // selector
}

const pointerTracker = {
    samples: [], // {x,y,t,angle}
    maxSamples: 6,
    lastVelocity: { vx: 0, vy: 0, speed: 0, angVel: 0 },
    getCenter() {
        const rect = SVG.getBoundingClientRect();
        return { x: rect.width / 2, y: rect.height / 2, left: rect.left, top: rect.top };
    },
    addSample(clientX, clientY, time) {
        const rect = SVG.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const angle = Math.atan2(y - cy, x - cx);
        this.samples.push({ x, y, t: time, angle });
        if (this.samples.length > this.maxSamples) this.samples.shift();
    },
    clear() { this.samples.length = 0; this.lastVelocity = { vx: 0, vy: 0, speed: 0, angVel: 0 }; },
    compute() {
        if (this.samples.length < 2) return this.lastVelocity;
        const first = this.samples[0];
        const last = this.samples[this.samples.length - 1];
        const dt = last.t - first.t; // ms
        if (dt <= 0) return this.lastVelocity;
        // linear velocity (px/s)
        const vx = (last.x - first.x) / dt;
        const vy = (last.y - first.y) / dt;
        const speed = Math.hypot(vx, vy);
        // angular velocity (rad/s) - compute shortest angular diff
        let dAngle = last.angle - first.angle;
        // normalize to [-PI, PI]
        while (dAngle <= -Math.PI) dAngle += Math.PI * 2;
        while (dAngle > Math.PI) dAngle -= Math.PI * 2;
        const angVel = dAngle / dt; // rad/s
        this.lastVelocity = { vx, vy, speed, angVel };
        return this.lastVelocity;
    }
};

function onPointerDown(e) {
    try { SVG.setPointerCapture && SVG.setPointerCapture(e.pointerId); } catch (err) { }
    pointerTracker.clear();
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.down = true;
}

function onPointerMove(e) {
    const isDown = e.pressure > 0 || e.buttons !== 0 || e.pointerType !== 'mouse';
    if (!isDown) return;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

function onPointerUp(e) {
    try { SVG.releasePointerCapture && SVG.releasePointerCapture(e.pointerId); } catch (err) { }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.down = false;
}

function angle_to_index(angle) {
    return parseInt(pins.length * (Math.PI * 2 - angle + (Math.PI / pins.length)) / (Math.PI * 2)) % pins.length;
}

function loop(now) {
    let delta_time = now - last_time;
    pointerTracker.addSample(mouse.x, mouse.y, performance.now());
    pointerTracker.compute();
    if (mouse.down) {
        angle_velocity = pointerTracker.lastVelocity.angVel * delta_time;
    }
    angle += angle_velocity;
    while (angle > Math.PI * 2) angle -= Math.PI * 2;
    while (angle <= 0) angle += Math.PI * 2;
    let index = angle_to_index(angle);
    pins.forEach((p, i) => p.setAttribute("fill", i === index ? "red" : "white"));

    let sel_bbox = pins[index].getBoundingClientRect();
    let [cx, cy, c_r] = [
        sel_bbox.left + sel_bbox.width / 2,
        sel_bbox.top + sel_bbox.height / 2,
        sel_bbox.width / 2
    ];

    wheel_0.setAttribute("transform", `rotate(${angle * 180 / Math.PI})`);
    angle_velocity *= (Math.tanh(100 * Math.abs(angle_velocity) + 2.5) * 0.995);
    last_time = now;
    requestAnimationFrame(loop);
}

function onload() {
    create_wheel_svg(SVG);
    // let c = new debug_canvas()
    // c.draw();
    requestAnimationFrame(loop);
}

window.addEventListener("load", onload);