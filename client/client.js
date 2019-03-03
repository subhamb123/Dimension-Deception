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
let userLevel = 1;
let userTileX = Math.random() * levelMaxTileX;
let userTileY = Math.random() * levelMaxTileY;

let userSpeed = 10;
const BULLET_SPEED = 20;

// let levelArray = generate2DArrayOfSize(100);

function generate2DArrayOfSize(size) {
	let arr = [];
	for (let i = 0; i < size; i++) {
		let row = [];
		for (let j = 0; j < size; j++) {
			row[j] = Math.floor(Math.random() * 5) / 5;
		}
		arr[i] = row;
	}
	return arr;
}

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
	e: keyboard(69)
};

const horizontalLines = [];
const verticalLines = [];
drawLines();
const boundaryBox = createBoundaryBox();

let gamestate = {
	players: [],
	portals: [],
	bullets: {},
    //trees: createRandomTrees(3),
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
});

makePortal();

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
        id: Math.random() * 20000
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

function createRandomTrees(n) {
	const trees = [];
	for (let i = 0; i < n; i++) {
		const circle = new PIXI.Graphics();
		const OUTLINE_WIDTH = 20;
		const RADIUS = (Math.random() + 0.5) * TILE_SIZE;
		circle.lineStyle(OUTLINE_WIDTH, 0x17B530, 1);
		circle.beginFill(0x21D53D);
		circle.drawCircle(0, 0, RADIUS);
		circle.endFill();
		circle.tileX = levelMaxTileX * Math.random();
		circle.tileY = levelMaxTileY * Math.random();
		circle.radius = RADIUS;

		stage.addChild(circle);
		trees.push(circle);
	}
	return trees;
}
socket.on('terrain', function(data) {
    for (let tree of gamestate.trees) {
        stage.removeChild(tree);
    }
    for (let tree of data.trees) {
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
});

function makePortal() {
	const circle = new PIXI.Graphics();
	const OUTLINE_WIDTH = 10;
	const RADIUS = TILE_SIZE;
	circle.lineStyle(OUTLINE_WIDTH, 0xB520A0, 1);
	circle.beginFill(0x000000);
	circle.drawCircle(0, 0, RADIUS);
	circle.endFill();
	circle.tileX = levelMaxTileX * Math.random();
	circle.tileY = levelMaxTileY * Math.random();
	circle.radius = RADIUS;

	stage.addChild(circle);
	gamestate.portals.push(circle);
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
	let distance = Math.hypot(userTileX - portal.tileX, userTileY - portal.tileY);
	return distance < TILE_SIZE * 3/ 2;
}

controls.q.press = () => {
	for (let portal of gamestate.portals) {
		if (isInPortal(portal)) {
			ELEMENTS.dimension.innerHTML = ++userLevel;
			return;
		}
	}
};
controls.e.press = () => {
	for (let portal of gamestate.portals) {
		if (isInPortal(portal)) {
			ELEMENTS.dimension.innerHTML = --userLevel;
			return;
		}
	}
};

function setup() {
	app.renderer.render(app.stage);
	app.ticker.add(delta => gameLoop(delta));
}

function isOutOfBounds(x, y) {
	return (x < 0 || y < 0 || x > levelMaxTileX || y > levelMaxTileY);
}

function fixPos(pos, vector, userRadius, originalPos) {
    let bestPos = {x : pos.x, y: pos.y};
	for (let tree of gamestate.trees) {
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

	if (controls.up.isDown || controls.w.isDown) {newPos.y -= userSpeed / delta;}
	if (controls.left.isDown || controls.a.isDown) {newPos.x -= userSpeed / delta;}
	if (controls.down.isDown || controls.s.isDown) {newPos.y += userSpeed / delta;}
	if (controls.right.isDown || controls.d.isDown) {newPos.x += userSpeed / delta;}

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

	for (let portal of gamestate.portals) {
		portal.x = (portal.tileX - userTileX) + app.renderer.width / 2;
		portal.y = (portal.tileY - userTileY) + app.renderer.height / 2;
	}
	for (let tree of gamestate.trees) {
		tree.x = (tree.tileX - userTileX) + app.renderer.width / 2;
		tree.y = (tree.tileY - userTileY) + app.renderer.height / 2;
	}
	for (let rock of gamestate.rocks) {
		rock.x = (rock.tileX - userTileX) + app.renderer.width / 2;
		rock.y = (rock.tileY - userTileY) + app.renderer.height / 2;
	}

	for (let i = 0; i < otherPlayers.data.length; i++) {
		if (otherPlayers.data[i].name === NAME) {
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
			health: 100
		}
	});

	ELEMENTS.data.innerHTML = `x: ${Math.round(userTileX)}, y: ${Math.round(userTileY)}`;
}

setup();
