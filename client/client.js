const socket = io();

let app = new PIXI.Application({
	width: 500,
	height: 500,
	antialias: true,
	transparent: false,
	resolution: 1
});
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
document.body.appendChild(app.view);

const DATA_ELEMENT = document.getElementById("data");

const stage = app.stage;

const TILE_SIZE = 50;

let userTileX = 10;
let userTileY = 10;
let userLevel = 0;

let userSpeed = 10;

let levelArray = generate2DArrayOfSize(100);

console.log(levelArray);

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
	space: keyboard(32)
};

const horizontalLines = [];
const verticalLines = [];

drawLines();

const userSprite = createUserSprite();

setup();

function createUserSprite() {
	const circle = new PIXI.Graphics();
	const OUTLINE_WIDTH = 10;
	circle.lineStyle(OUTLINE_WIDTH, 0x6C3ACC, 1);
	circle.drawCircle(0, 0, (TILE_SIZE - OUTLINE_WIDTH) / 2);
	circle.x = app.renderer.width / 2;
	circle.y = app.renderer.height / 2;

	stage.addChild(circle);
	return circle;
}

// draws a grid of horizontal and vertical lines
function drawLines() {
	for (let i = 0; i < app.renderer.width + TILE_SIZE; i += TILE_SIZE) {
		const line = new PIXI.Graphics();
		line.lineStyle(1, 0x333333, 1);
		line.moveTo(i, 0);
		line.lineTo(i, app.renderer.height);
		verticalLines.push(line);
		app.stage.addChild(line);
	}
	for (let j = 0; j < app.renderer.height + TILE_SIZE; j += TILE_SIZE) {
		const line = new PIXI.Graphics();
		line.lineStyle(1, 0x333333, 1);
		line.moveTo(0, j);
		line.lineTo(app.renderer.width, j);
		horizontalLines.push(line);
		app.stage.addChild(line);
	}
}

function setup() {

	app.renderer.render(app.stage);
	app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {

	if (controls.up.isDown || controls.w.isDown) {userTileY -= userSpeed/delta;}
	if (controls.left.isDown || controls.a.isDown) {userTileX -= userSpeed/delta;}
	if (controls.down.isDown || controls.s.isDown) {userTileY += userSpeed/delta;}
	if (controls.right.isDown || controls.d.isDown) {userTileX += userSpeed/delta;}

	for (let line of verticalLines) {
		line.position.x = -userTileX % TILE_SIZE;
	}
	for (let line of horizontalLines) {
		line.position.y = -userTileY % TILE_SIZE;
	}

	DATA_ELEMENT.innerHTML = `x: ${Math.floor(userTileX * 100)/100}, y: ${Math.floor(userTileY * 100)/100}`;
}
