function intersectionCircleAndLine(circleRad, line) {
    let a = -line.dy;
    let b = line.dx;
    let c = - (a * line.x + b * line.y);

    let D = c;
    let dx = line.dx;
    let dy = line.dy;
    let dr = Math.hypot(dx, dy);
    let r = circleRad;
    x1 = (D * dy + (dy < 0 ? -1 : 1) * dx * Math.sqrt(r * r * dr * dr - D * D)) / (dr * dr);
    x2 = (D * dy - (dy < 0 ? -1 : 1) * dx * Math.sqrt(r * r * dr * dr - D * D)) / (dr * dr);
    y1 = (-D* dx + Math.abs(dy) * Math.sqrt(r * r * dr * dr - D * D)) / (dr * dr);
    y2 = (-D* dx - Math.abs(dy) * Math.sqrt(r * r * dr * dr - D * D)) / (dr * dr);
    return [[x1, y1], [x2, y2]];
}
function perpendicularLine(line) {
    let res = {x: (2 * line.x + line.dx)/2, y: (2 * line.y + line.dy)/2, dx: -line.dy, dy: line.dx};
    return res;
}
function limitMag(line, target = 1) {
    let mag = Math.hypot(line.dx, line.dy);
    line.dx *= target / mag;
    line.dy *= target / mag;
}