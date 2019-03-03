// Function to linearly interpolate between a0 and a1
// Weight w should be in the range [0.0, 1.0]
function lerp(a0, a1, w) {
    return (1.0 - w)*a0 + w*a1;

    // as an alternative, this slightly faster equivalent formula can be used:
    // return a0 + w*(a1 - a0);
}

// Computes the dot product of the distance and gradient vectors.
function  dotGridGradient(ix, iy, x, y, Gradient) {

    // Precomputed (or otherwise) gradient vectors at each grid node
    //extern float Gradient[IYMAX][IXMAX][2];
    

    // Compute the distance vector
    let dx = x - ix;
    let dy = y - iy;

    // Compute the dot-product
    return (dx*Gradient[iy][ix][0] + dy*Gradient[iy][ix][1]);
}

// Compute Perlin noise at coordinates x, y
exports.perlin = function (x, y, Gradient) {

    // Determine grid cell coordinates
    let x0 = Math.floor(x);
    let x1 = x0 + 1;
    let y0 = Math.floor(y);
    let y1 = y0 + 1;

    // Determine interpolation weights
    // Could also use higher order polynomial/s-curve here
    let sx = x - x0;
    let sy = y - y0;

    // Interpolate between grid point gradients
    let n0, n1, ix0, ix1, value;
    n0 = dotGridGradient(x0, y0, x, y, Gradient);
    n1 = dotGridGradient(x1, y0, x, y, Gradient);
    ix0 = lerp(n0, n1, sx);
    n0 = dotGridGradient(x0, y1, x, y, Gradient);
    n1 = dotGridGradient(x1, y1, x, y, Gradient);
    ix1 = lerp(n0, n1, sx);
    value = lerp(ix0, ix1, sy);

    return value;
}

module.exports.generateRandomGradient= function (x, y) {
    let Gradient = [];
    for (let i = 0; i < y; i++) {
        let row = [];
        for (let j = 0; j < x; j++) {
            row[j] = generateRandomUnitVector();
        }
        Gradient[i] = row;
    }
    return Gradient;
}
function generateRandomUnitVector() {
    let x = Math.random();
    let y = Math.random();
    let mag = Math.hypot(x, y);
    return [x/mag, y/mag];
}