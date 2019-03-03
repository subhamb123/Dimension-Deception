let perlin = require('./perlin');
module.exports = {
    generate: function(width, height, freq, size) {
        freq *= 1.0;
        let grad = perlin.generateRandomGradient(width * freq + 1, height * freq + 1);
        let threshold = 1.0 / size;

        let res = [];
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (perlin.perlin(x * freq, y * freq, grad) > threshold) {
                    res.push({x: x, y: y});
                }
            }
        }
        return res;
    },
    generateWithHeight: function(width, height, freq, size, absorbRadius = 100) {
        freq *= 1.0;
        let grad = perlin.generateRandomGradient(width * freq + 1, height * freq + 1);
        let threshold = 1.0 / size;
        console.log(threshold);

        let res = [];
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let p = perlin.perlin(x * freq, y * freq, grad)
                if (p > threshold) {
                    let change = false;
                    let h = (p - threshold)/(1 - threshold);
                    for (let r of res) {
                        if (Math.hypot(x - r.x, y - r.y) < absorbRadius) {
                            r.x = (r.x * r.h + x * h) / (r.h + h);
                            r.y = (r.y * r.h + y * h) / (r.h + h);
                            r.h += h;
                            change = true;
                            break;
                        }
                    }
                    if (!change) {
                        res.push({x: x, y: y, h: h});
                    }
                }
            }
        }
        return res;
    }
}

