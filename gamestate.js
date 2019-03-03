module.exports = {
    createPlayer: function(name) {
        return {name: name, health: 100, x: 0, y:0, dx: 0, dy: 0};
    },
    createBullet: function(x, y, vx, vy) {
        return {x: x, y: y, vx: vx, vy: vy};
    },
    createItem: function(x, y, name) {
        return {x: x, y: y, name: name};
    },
    createObstacle: function(x, y, name, radius) {
        return {x: x, y:y, name: name, radius: radius};
    },
    removeBullets: function(bullets, boardSize) {
        for (let prop in bullets) {
            if (bullets.hasOwnProperty(prop)) {
                let bullet = bullets[prop];
                if (bullet.x < 0 || bullet.y < 0 || bullet.x > boardSize || bullet.y > boardSize) {
                    delete bullets[prop];
                }
            }
        }
    }
}
