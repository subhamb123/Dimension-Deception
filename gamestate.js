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
        for (let i = 0; i < bullets.length; i++) {
            let bullet = bullets[i];
            if (bullet.x < 0 || bullet.y < 0 || bullet.x > boardSize || bullet.y > boardSize) {
                bullets.splice(i, 1);
                i--;
            }
        }
    }
}
