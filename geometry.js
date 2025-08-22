function dot(ax, ay, bx, by) {
    return ax * bx + ay * by;
}

function pointOnTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const abx = bx - ax, aby = by - ay;
    const acx = cx - ax, acy = cy - ay;
    const apx = px - ax, apy = py - ay;

    // vertex region outside a
    const d1 = dot(abx, aby, apx, apy);
    const d2 = dot(acx, acy, apx, apy);
    if (d1 <= 0 && d2 <= 0) {
        return [ax, ay];
    }

    // vertex region outside b
    const bpx = px - bx, bpy = py - by;
    const d3 = dot(abx, aby, bpx, bpy);
    const d4 = dot(acx, acy, bpx, bpy);
    if (d3 >= 0 && d4 <= d3) {
        return [bx, by];
    }

    // edge region ab
    if (d1 >= 0 && d3 <= 0 && d1 * d4 - d3 * d2 <= 0) {
        const v = d1 / (d1 - d3);
        return [ax + abx * v, ay + aby * v];
    }

    // vertex region outside c
    const cpx = px - cx, cpy = py - cy;
    const d5 = dot(abx, aby, cpx, cpy);
    const d6 = dot(acx, acy, cpx, cpy);
    if (d6 >= 0 && d5 <= d6) {
        return [cx, cy];
    }

    // edge region ac
    if (d2 >= 0 && d6 <= 0 && d5 * d2 - d1 * d6 <= 0) {
        const w = d2 / (d2 - d6);
        return [ax + acx * w, ay + acy * w];
    }

    // edge region bc
    if (d3 * d6 - d5 * d4 <= 0) {
        const d43 = d4 - d3;
        const d56 = d5 - d6;
        if (d43 >= 0 && d56 >= 0) {
            const w = d43 / (d43 + d56);
            return [bx + (cx - bx) * w, by + (cy - by) * w];
        }
    }

    // inside face region
    return [px, py];
}

function pointInCircle(px, py, cx, cy, r) {
    const dx = px - cx
    const dy = py - cy
    return dx * dx + dy * dy <= r * r
}

function triangleVsCircle(ax, ay, bx, by, cx, cy, sx, sy, r) {
    const [qx, qy] = pointOnTriangle(sx, sy, ax, ay, bx, by, cx, cy)
    return pointInCircle(qx, qy, sx, sy, r)
}

function selector_collision_points() {
    angle = Math.acos(1 / 2);
    let c = Math.cos(angle);
    let s = Math.sin(angle);
    return [[-s,c],[s,c],[0,2]]
}

function transform_point(p, m) {
    let x = p[0], y = p[1];
    return [
        m[0][0] * x + m[0][1] * y + m[0][2],
        m[1][0] * x + m[1][1] * y + m[1][2]
    ];
}
