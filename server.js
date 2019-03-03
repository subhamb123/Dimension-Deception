// Setup basic express server
const express = require("express");
const app = express();
const path = require("path");
const server = require("http").createServer(app);
var io = require("socket.io")(server);
const port = process.env.PORT || 3000;

const BOARD_SIZE = 1000;

server.listen(port, () => {
	console.log("Server listening at port " + port);
});

// Routing
app.use(express.static(path.join(__dirname, "client")));

let users = {};

const GAMESTATE = require('./gamestate.js');
let gamestate = {players: {}, bullets: {}, items: [], ticks: 0};
const PHYSICS = require('./physics');
// let terrain = {};
let terrainByLevels = [{}, {}, {}, {}, {}];

//generate world
const GENERATOR = require('./procedural gen/obstaclesgen');
function generateTerrain(obstacles) {

	//let rocks = GENERATOR.generate(10000, 10000, 0.1, 0.5);
	//obstacles.rocks = rocks;

	let trees = GENERATOR.generateWithHeight(BOARD_SIZE, BOARD_SIZE, 0.01, 5);
	for (let tree of trees) {
		tree.h = Math.random() + 0.5;
	}
	obstacles.trees = trees;
}
for (let i = 0; i < terrainByLevels.length; i++) {
	generateTerrain(terrainByLevels[i]);
}

io.on("connection", function(socket) {
	users[socket.id] = socket;
	console.log("Connect! Num users: " + Object.keys(users).length);
	socket.emit('terrain', terrainByLevels);

	socket.on("disconnect", function() {
		delete users[socket.id];
		delete gamestate.players[socket.id];
		console.log("Disconnect! Num users: " + Object.keys(users).length);
	});
	socket.on("addplayer", name => {
		gamestate.players[socket.id] = GAMESTATE.createPlayer(name);
		console.log("New player named " + name);
	});
	socket.on("playermove", function(data) {
		if (gamestate.players.hasOwnProperty(socket.id)) {
			let health = gamestate.players[socket.id].health;
			data.player.health = health;
			gamestate.players[socket.id] = data.player;
		}
	});
	socket.on("playershoot", function(bullet) {
		bullet.damage = 5;
		bullet.player = socket.id;
		gamestate.bullets[bullet.id] = bullet;
	})

});

const SLEEP_TIME = 20;
function mainLoop(timeUsed = 0) {
	let t = Date.now();

	// Game logic, check if bullet intersects
	PHYSICS.bulletsHit(gamestate);
	//check if bullets removeable
	GAMESTATE.removeBullets(gamestate.bullets, BOARD_SIZE);

	// send to every client
	io.emit("update", {
		gamestate: gamestate
	});

	t = Date.now() - t;
	setTimeout(function() {
		mainLoop(t);
	}, SLEEP_TIME - timeUsed);
	gamestate.ticks++;
}

mainLoop();
