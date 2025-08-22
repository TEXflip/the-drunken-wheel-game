const canvas = document.getElementById('wheelCanvas');

class Wheel {
    constructor(canvas) {
        this.update(canvas);
    }
    update(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.angle = 0;
        this.angle_velocity = 0;
        this.center = { x: canvas.width / 2 + 0.5, y: canvas.height / 2 + 0.5 };
        this.radius = Math.min(canvas.width, canvas.height) / 2 - 8;
        this.choices = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
        this.color_palette = this.choices.map((_, index) => {
            const hue = (index / this.choices.length) * 360;
            return `hsl(${hue}, 100%, 50%)`;
        });
        this.arcs = [];
        this.choices.forEach((choice, index) => {
            const angle = (index / this.choices.length) * Math.PI * 2;
            const arc = new Path2D();
            arc.moveTo(0, 0);
            arc.arc(
                0,
                0,
                this.radius,
                angle,
                angle + Math.PI * 2 / this.choices.length
            );
            this.arcs.push(arc);
        });
    }
    draw() {
        this.angle += this.angle_velocity;
        this.angle_velocity = this.angle_velocity * (Math.tanh(100 * Math.abs(this.angle_velocity) + 2.5) * 0.995);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.center.x, this.center.y);
        this.ctx.rotate(this.angle);
        this.arcs.forEach((arc, index) => {
            this.ctx.fillStyle = this.color_palette[index];
            this.ctx.fill(arc);
            this.ctx.fillStyle = 'black';
            const angle = (index + 0.5) / this.choices.length * Math.PI * 2;
            this.ctx.fillText(this.choices[index], Math.cos(angle) * this.radius * 0.5, Math.sin(angle) * this.radius * 0.5);
            this.ctx.strokeStyle = 'black';
            this.ctx.stroke(arc);
        });
        this.ctx.restore();
    }

}

const wheel = new Wheel(canvas);
let STATES = {
    apply_velocity: false,
}
let mouse = {
    x: 0,
    y: 0,
    down: false
};
let last_time = 0;

const pointerTracker = {
    samples: [], // {x,y,t,angle}
    maxSamples: 6,
    lastVelocity: { vx: 0, vy: 0, speed: 0, angVel: 0 },
    getCenter() {
        const rect = canvas.getBoundingClientRect();
        return { x: rect.width / 2, y: rect.height / 2, left: rect.left, top: rect.top };
    },
    addSample(clientX, clientY, time) {
        const rect = canvas.getBoundingClientRect();
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
    try { canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); } catch (err) { }
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
    try { canvas.releasePointerCapture && canvas.releasePointerCapture(e.pointerId); } catch (err) { }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.down = false;
}

// Provide a helper to get the last computed pointer velocity
canvas.getLastPointerVelocity = function () {
    return canvas._lastPointerVelocity || pointerTracker.lastVelocity || { vx: 0, vy: 0, speed: 0, angVel: 0 };
};

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || canvas.width;
    const cssH = canvas.clientHeight || canvas.height;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    wheel.update(canvas);
}

function loop(now) {
    let delta_time = now - last_time;
    pointerTracker.addSample(mouse.x, mouse.y, performance.now());
    pointerTracker.compute();
    // console.log(wheel.angle_velocity);
    if (mouse.down) {
        wheel.angle_velocity = pointerTracker.lastVelocity.angVel * delta_time;
    }
    wheel.draw();
    last_time = now;
    requestAnimationFrame(loop);
}

function onLoad() {
    resizeCanvas();
    last_time = performance.now();
    requestAnimationFrame(loop);
}

window.onload = onLoad;
window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('pointercancel', () => pointerTracker.clear());