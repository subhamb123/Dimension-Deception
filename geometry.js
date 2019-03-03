module.exports = {
    distancePointAndLine: function(point, line) {
        let a = -line.dy;
        let b = line.dx;
        let c = - (a * line.x + b * line.y);

        let distance = Math.abs(a*point.x + b * point.y + c)/Math.hypot(a, b);
        return distance;
    },
    perpendicularLine: function(line) {
        let res = {x: (2 * line.x + line.dx)/2, y: (2 * line.y + line.dy)/2, dx: -line.dy, dy: line.dx};
        return res;
    },
    lineCollidesCircle: function(point, circleRad, line) {
        let perp = this.perpendicularLine(line);
        if (this.distancePointAndLine(point, perp) < Math.hypot(line.dx, line.dy)/2 &&
            this.distancePointAndLine(point, line) < circleRad) {
            return true;
        } else if (Math.hypot(point.x - line.x, point.y - line.y) < circleRad ||
                    Math.hypot(line.x + line.dx - point.x, line.y + line.dy - point.y)) {
            return true;
        }
        return false;
    }
}