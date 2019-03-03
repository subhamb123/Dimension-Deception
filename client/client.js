const socket = io();

const NAME = "Player " + Math.floor(Math.random() * 1000);
socket.on("connect", () => {
	document.getElementById("name").innerHTML = NAME;
	socket.emit("addplayer", NAME);
});

const BACKGROUND_COLOR = 0x282C34;

let app = new PIXI.Application({
	width: 500,
	height: 500,
	antialias: true,
	transparent: false,
	backgroundColor: BACKGROUND_COLOR,
	resolution: 1
});
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
document.body.appendChild(app.view);

const ELEMENTS = {
	data: document.getElementById("data"),
	health: document.getElementById("health"),
	dimension: document.getElementById("dimension"),
	players: document.getElementById("players")
};

const stage = app.stage;

const TILE_SIZE = 50;

let levelMaxTileX = 1000;
let levelMaxTileY = 1000;
let userLevel = 0;
let userTileX = Math.random() * levelMaxTileX;
let userTileY = Math.random() * levelMaxTileY;
let myHealth = 100;
let portalCooldown = Date.now();

let userSpeed = 10;
const portalMaxCooldown = 5000;
const userSpeedMultiplerByLevel = [
	1,
	2,
	3,
	4,
	5
];
const BULLET_SPEED = 20;

let terrainByLevels = [];

let controls = {
	w: keyboard(87),
	a: keyboard(65),
	s: keyboard(83),
	d: keyboard(68),
	up: keyboard(38),
	down: keyboard(40),
	right: keyboard(39),
	left: keyboard(37),
	q: keyboard(81),
    e: keyboard(69),
    space: keyboard(32)
};

const horizontalLines = [];
const verticalLines = [];
drawLines();
const boundaryBox = createBoundaryBox();

let gamestate = {
	players: [],
	portals: {},
	bullets: {},
    trees: [],
    rocks: []
};

let numUsers = 0;
let otherPlayers = {
	// data[i] maps to sprites[i]
	data: [], // from server
	sprites: [] // on client
};

function addPlayerSprite() {
	const circle = new PIXI.Graphics();
	const OUTLINE_WIDTH = 10;
	circle.lineStyle(OUTLINE_WIDTH, 0x3AB6CC, 1);
	circle.beginFill(0x111111);
	circle.drawCircle(0, 0, (TILE_SIZE - OUTLINE_WIDTH) / 2);
	circle.endFill();
	stage.addChild(circle);
	otherPlayers.sprites.push(circle);
}

socket.on("update", data => {
	otherPlayers.data = Object.values(data.gamestate.players);
	while (otherPlayers.data.length > otherPlayers.sprites.length) {
		addPlayerSprite();
    }
    for (let id in gamestate.bullets) {
        if (gamestate.bullets.hasOwnProperty(id)) {
            if (!data.gamestate.bullets.hasOwnProperty(id)) {
                // console.log('removed %s', gamestate.bullets[id]);
                stage.removeChild(gamestate.bullets[id]);
                delete gamestate.bullets[id];
            }
        }
    }
    for (let id in data.gamestate.bullets) {
        if (data.gamestate.bullets.hasOwnProperty(id)) {
            if (gamestate.bullets.hasOwnProperty(id)) {
                gamestate.bullets[id].tileX = data.gamestate.bullets[id].x;
                gamestate.bullets[id].tileY = data.gamestate.bullets[id].y;
            } else {
                makeBullet(data.gamestate.bullets[id]);
            }
        }
    }
    for (let id in gamestate.portals) {
        if (gamestate.portals.hasOwnProperty(id)) {
            if (!data.gamestate.portals.hasOwnProperty(id)) {
                // console.log('removed %s', gamestate.bullets[id]);
                stage.removeChild(gamestate.portals[id]);
                delete gamestate.portals[id];
            }
        }
    }
    for (let id in data.gamestate.portals) {
        if (data.gamestate.portals.hasOwnProperty(id)) {
            if (gamestate.portals.hasOwnProperty(id)) {
                gamestate.portals[id].tileX = data.gamestate.portals[id].x;
                gamestate.portals[id].tileY = data.gamestate.portals[id].y;
                gamestate.portals[id].direction = data.gamestate.portals[id].direction;
                gamestate.portals[id].level = data.gamestate.portals[id].level;
            } else {
                makePortal(data.gamestate.portals[id], id);
            }
        }
    }
});


const userSprite = createUserSprite();

// handle shooting
app.renderer.plugins.interaction.on("mousedown", event => {
	const point = event.data.global;

	const hypotenuse = Math.hypot(point.x - app.renderer.width / 2, point.y - app.renderer.height / 2);

	let bullet = {
		x: userTileX,
		y: userTileY,
		vx: (point.x - app.renderer.width / 2) / hypotenuse * BULLET_SPEED,
        vy: (point.y - app.renderer.height / 2) / hypotenuse * BULLET_SPEED,
        id: Math.random() * 20000,
        level: userLevel
	};
    makeBullet(bullet);
	socket.emit("playershoot", bullet);
});

function makeBullet(bullet) {
	const circle = new PIXI.Graphics();
	const OUTLINE_WIDTH = 2;
	circle.beginFill(0xE63232);
	circle.drawCircle(0, 0, (TILE_SIZE / 5 - OUTLINE_WIDTH) / 2);
	circle.endFill();
	circle.x = app.renderer.width / 2;
	circle.y = app.renderer.height / 2;
	circle.tileX = bullet.x;
	circle.tileY = bullet.y;
	circle.vx = bullet.vx;
    circle.vy = bullet.vy;
    circle.id = bullet.id;

	stage.addChild(circle);
	gamestate.bullets[bullet.id] = circle;
}

function createUserSprite() {
	const circle = new PIXI.Graphics();
	const OUTLINE_WIDTH = 10;
	circle.lineStyle(OUTLINE_WIDTH, 0x6C3ACC, 1);
	circle.beginFill(BACKGROUND_COLOR);
	circle.drawCircle(0, 0, (TILE_SIZE - OUTLINE_WIDTH) / 2);
	circle.endFill();
	circle.x = app.renderer.width / 2;
	circle.y = app.renderer.height / 2;

	stage.addChild(circle);
	return circle;
}

function createBoundaryBox() {
	const rect = new PIXI.Graphics();
	rect.lineStyle(6, 0xCCCCCC, 1);
	rect.drawRect(-TILE_SIZE / 2,- TILE_SIZE / 2, levelMaxTileX + TILE_SIZE, levelMaxTileY + TILE_SIZE);
	stage.addChild(rect);
	return rect;
}

function setGamestateTreesToTerrain(terrain) {
	for (let tree of gamestate.trees) {
		stage.removeChild(tree);
	}
	gamestate.trees = [];
	for (let tree of terrain.trees) {
        const circle = new PIXI.Graphics();
		const OUTLINE_WIDTH = 20;
		const RADIUS = (tree.h) * TILE_SIZE;
		circle.lineStyle(OUTLINE_WIDTH, 0x17B530, 1);
		circle.beginFill(0x21D53D);
		circle.drawCircle(0, 0, RADIUS);
		circle.endFill();
		circle.tileX = tree.x;
		circle.tileY = tree.y;
		circle.radius = RADIUS;

		stage.addChild(circle);
		gamestate.trees.push(circle);
    }
}
function setGamestateRocksToTerrain(terrain) {
	for (let rock of gamestate.rocks) {
		stage.removeChild(rock);
	}
	gamestate.rocks = [];
	for (let rock of terrain.rocks) {
        const circle = new PIXI.Graphics();
		const OUTLINE_WIDTH = 20;
		const RADIUS = (rock.h) * TILE_SIZE;
		circle.lineStyle(OUTLINE_WIDTH, 0x404040, 1);
		circle.beginFill(0x808080);
		circle.drawCircle(0, 0, RADIUS);
		circle.endFill();
		circle.tileX = rock.x;
		circle.tileY = rock.y;
		circle.radius = RADIUS;

		stage.addChild(circle);
		gamestate.rocks.push(circle);
    }
}

socket.on('terrain', function(data) {
    for (let tree of gamestate.trees) {
        stage.removeChild(tree);
    }
	for (let rock of gamestate.rocks) {
        stage.removeChild(rock);
    }
	terrainByLevels = data;
    setGamestateRocksToTerrain(data[userLevel]);
	setGamestateTreesToTerrain(data[userLevel]);
});

function makePortal(portal, id = socket.id) {
	const circle = new PIXI.Graphics();
	const OUTLINE_WIDTH = 10;
	const RADIUS = TILE_SIZE;
	circle.lineStyle(OUTLINE_WIDTH, 0xB520A0, 1);
	circle.beginFill(0x000000);
	circle.drawCircle(0, 0, RADIUS);
	circle.endFill();
	circle.tileX = portal.x;
    circle.tileY = portal.y;
    circle.direction = portal.direction;
    circle.level = portal.level;
    circle.radius = RADIUS;

	stage.addChild(circle);
	gamestate.portals[id] = circle;
}

// draws a grid of horizontal and vertical lines
function drawLines() {
	const LINE_COLOR = 0x3C4252;
	const X_OFFSET = (app.renderer.width / 2) % TILE_SIZE;
	for (let i = 0; i < app.renderer.width + TILE_SIZE; i += TILE_SIZE) {
		const line = new PIXI.Graphics();
		line.lineStyle(1, LINE_COLOR, 1);
		line.moveTo(i + X_OFFSET, 0);
		line.lineTo(i + X_OFFSET, app.renderer.height);
		verticalLines.push(line);
		app.stage.addChild(line);
	}
	const Y_OFFSET = (app.renderer.height / 2) % TILE_SIZE;
	for (let j = 0; j < app.renderer.height + TILE_SIZE; j += TILE_SIZE) {
		const line = new PIXI.Graphics();
		line.lineStyle(1, LINE_COLOR, 1);
		line.moveTo(0, j + Y_OFFSET);
		line.lineTo(app.renderer.width, j + Y_OFFSET);
		horizontalLines.push(line);
		app.stage.addChild(line);
	}
}

function isInPortal(portal) {
    if (portal.level !== userLevel) {return false;}
	let distance = Math.hypot(userTileX - portal.tileX, userTileY - portal.tileY);
	return distance < TILE_SIZE * 3/ 2 ? distance : false;
}

controls.q.press = () => {
    if (userLevel === terrainByLevels.length - 1) {return;}
    if (Date.now() - portalCooldown < portalMaxCooldown) {return;}
    portalCooldown = Date.now();
    let portal = {x: userTileX, y: userTileY, direction: 1, level: userLevel};
    socket.emit('playerportal', portal);
    makePortal(portal);
    userLevel++;
    updateDimension();
};
controls.e.press = () => {
    if (userLevel === 0) {return;}
    if (Date.now() - portalCooldown < portalMaxCooldown) {return;}
    portalCooldown = Date.now();
    let portal = {x: userTileX, y: userTileY, direction: -1, level: userLevel};
    socket.emit('playerportal', portal);
    makePortal(portal);
    userLevel--;
    updateDimension();
};

controls.space.press = () => {
    let portal = null;
    let dist = 0;
    for (let p of Object.values(gamestate.portals)) {
        let d = isInPortal(p);
        if (d && (portal == null || d < dist)) {
            dist = d;
            portal = p;
        }
    }
    if (portal != null) {
        userLevel += portal.direction;
        updateDimension();
    }
};

function updateDimension() {
    ELEMENTS.dimension.innerHTML = userLevel + 1;
    setGamestateTreesToTerrain(terrainByLevels[userLevel]);

}

function setup() {
	app.renderer.render(app.stage);
	app.ticker.add(delta => gameLoop(delta));
}

function isOutOfBounds(x, y) {
	return (x < 0 || y < 0 || x > levelMaxTileX || y > levelMaxTileY);
}

function fixPos(pos, vector, userRadius, originalPos) {
    let bestPos = {x : pos.x, y: pos.y};
	for (let tree of gamestate.rocks) {
		const distance = Math.hypot(pos.x - tree.tileX, pos.y - tree.tileY);
		if (distance < userRadius + tree.radius - 0.001) {
            let intersections = intersectionCircleAndLine(userRadius + tree.radius,
                {x: pos.x - tree.tileX, y: pos.y - tree.tileY, dx: vector.dx, dy: vector.dy});
            let intersection;
            intersections[0][0] += tree.tileX;
            intersections[0][1] += tree.tileY;
            intersections[1][0] += tree.tileX;
            intersections[1][1] += tree.tileY;
            if (Math.hypot(intersections[0][0] - originalPos.x, intersections[0][1] - originalPos.y)
            < Math.hypot(intersections[1][0] - originalPos.x, intersections[1][1] - originalPos.y)) {
                intersection = intersections[0];
            } else {
                intersection = intersections[1];
            }
            let newPos = {x: intersection[0], y: intersection[1]};
            if (distance < tree.radius || Math.hypot(bestPos.x - originalPos.x, bestPos.y - originalPos.y) >
                Math.hypot(newPos.x - originalPos.x, newPos.y - originalPos.y)) {

                if (Math.hypot(newPos.x - originalPos.x, newPos.y - originalPos.y) < 0.0001) {
                    let directLine = {x: newPos.x, y: newPos.y,
                        dx: newPos.x - tree.tileX, dy: newPos.y - tree.tileY};
                    if (!(Math.abs(directLine.dx * vector.dy - directLine.dy * vector.dx) < 0.000000001)) {
                        let tangent = perpendicularLine(directLine);
                        //check if direction change
                        if (tangent.dx * vector.dx + tangent.dy * vector.dy < 0) {
                            tangent.dx *= -1;
                            tangent.dy *= -1;
                        }
                        limitMag(tangent, userSpeed);
                        newPos.x += tangent.dx;
                        newPos.y += tangent.dy;
                        fixPos(newPos, tangent, userRadius, originalPos)
                    }
                }
                bestPos = newPos;
            }
		}
	}
	pos.x = bestPos.x;
	pos.y = bestPos.y;
}

function gameLoop(delta) {
	let newPos = {
		x: userTileX,
		y: userTileY
	};

	let adjustedSpeed = userSpeed * userSpeedMultiplerByLevel[userLevel];

	if (controls.up.isDown || controls.w.isDown) {newPos.y -= adjustedSpeed  / delta;}
	if (controls.left.isDown || controls.a.isDown) {newPos.x -= adjustedSpeed  / delta;}
	if (controls.down.isDown || controls.s.isDown) {newPos.y += adjustedSpeed  / delta;}
	if (controls.right.isDown || controls.d.isDown) {newPos.x += adjustedSpeed  / delta;}

	if (newPos.x < 0) {newPos.x = 0;}
	if (newPos.y < 0) {newPos.y = 0;}
	if (newPos.x > levelMaxTileX) {newPos.x = levelMaxTileX;}
	if (newPos.y > levelMaxTileY) {newPos.y = levelMaxTileY;}

	let movementVector = {dx: newPos.x - userTileX, dy: newPos.y - userTileY};
    if (Math.abs(movementVector.dx) + Math.abs(movementVector.dy) > 0.0001) {
        fixPos(newPos, movementVector, TILE_SIZE / 2, {x: userTileX, y: userTileY});
    }

	if (newPos.x < 0) {newPos.x = 0;}
	if (newPos.y < 0) {newPos.y = 0;}
	if (newPos.x > levelMaxTileX) {newPos.x = levelMaxTileX;}
    if (newPos.y > levelMaxTileY) {newPos.y = levelMaxTileY;}

    userTileX = newPos.x;
    userTileY = newPos.y;

	for (let line of verticalLines) {
		line.position.x = -userTileX % TILE_SIZE;
	}
	for (let line of horizontalLines) {
		line.position.y = -userTileY % TILE_SIZE;
	}

	boundaryBox.x = app.renderer.width / 2 - userTileX;
	boundaryBox.y = app.renderer.height / 2 - userTileY;

	for (let prop in gamestate.bullets) {
        if (!gamestate.bullets.hasOwnProperty(prop)) {continue;}
		const bullet = gamestate.bullets[prop];
		bullet.tileX += bullet.vx / delta;
		bullet.tileY += bullet.vy / delta;
		if (isOutOfBounds(bullet.tileX, bullet.tileY)) {
			delete gamestate.bullets[prop];
			app.stage.removeChild(bullet);
		} else {
			bullet.x = (bullet.tileX - userTileX) + app.renderer.width / 2;
			bullet.y = (bullet.tileY - userTileY) + app.renderer.height / 2;
		}
    }

	for (let portal of Object.values(gamestate.portals)) {
		portal.x = (portal.tileX - userTileX) + app.renderer.width / 2;
        portal.y = (portal.tileY - userTileY) + app.renderer.height / 2;
        portal.visible = portal.level === userLevel ? true : false;
	}
	for (let tree of gamestate.trees) {
		let distance = Math.hypot(userTileX - tree.tileX, userTileY - tree.tileY) / (TILE_SIZE / 2 + tree.radius);
		if (distance < 1) {
			tree.alpha = 0.7 * distance + 0.15;
		} else {
			tree.alpha = 0.85;
		}
		tree.x = (tree.tileX - userTileX) + app.renderer.width / 2;
        tree.y = (tree.tileY - userTileY) + app.renderer.height / 2;
	}
	for (let rock of gamestate.rocks) {
		rock.x = (rock.tileX - userTileX) + app.renderer.width / 2;
		rock.y = (rock.tileY - userTileY) + app.renderer.height / 2;
	}

	for (let i = 0; i < otherPlayers.data.length; i++) {
		if (otherPlayers.data[i].name === NAME) {
            myHealth = otherPlayers.data[i].health;
			ELEMENTS.health.setAttribute("value", myHealth);
			app.stage.removeChild(otherPlayers.sprites[i]);
		} else {
			otherPlayers.data[i].x += otherPlayers.data[i].dx;
			otherPlayers.data[i].y += otherPlayers.data[i].dy;
			otherPlayers.sprites[i].x = (otherPlayers.data[i].x - userTileX) + app.renderer.width / 2;
			otherPlayers.sprites[i].y = (otherPlayers.data[i].y - userTileY) + app.renderer.height / 2;
		}
	}
	// delete the player sprites without corresponding data
	while (otherPlayers.sprites.length > otherPlayers.data.length) {
		otherPlayers.sprites.pop();
	}

	if (numUsers !== otherPlayers.data.length) {
		numUsers = otherPlayers.data.length;
		ELEMENTS.players.innerHTML = numUsers;
	}

	socket.emit("playermove", {
		player: {
			x: userTileX,
			y: userTileY,
			dx: 0,
			dy: 0,
            name: NAME,
            level: userLevel
		}
	});

	ELEMENTS.data.innerHTML = `x: ${Math.round(userTileX)}, y: ${Math.round(userTileY)}`;
}

setup();
