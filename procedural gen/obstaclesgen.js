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
    }
}

