// Setup basic express server
const express = require("express");
const app = express();
const path = require("path");
const server = require("http").createServer(app);
var io = require("socket.io")(server);
const port = process.env.PORT || 3000;

server.listen(port, () => {
	console.log("Server listening at port " + port);
});

// Routing
app.use(express.static(path.join(__dirname, "client")));

let users = {};

const GAMESTATE = require('./gamestate.js');
let gamestate = {players: {}, bullets: [], obstacles: [], items: [], ticks: 0};
const PHYSICS = require('./physics');

//generate world
const GENERATOR = require('./procedural gen/obstaclesgen');
(function(obstacles) {
	let rocks = GENERATOR.generate(10000, 10000, 0.1, 0.5);
	for (const rock of rocks) {
		rock.name = 'rock';
	}
	obstacles.push(...rocks);
})(gamestate.obstacles);

io.on("connection", function(socket) {
	users[socket.id] = socket;
	console.log("Connect! Num users: " + Object.keys(users).length);

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
			gamestate.players[socket.id] = data.player;
		}
	});
	socket.on("playershoot", function(bullet) {
		bullet.damage = 5;
		gamestate.bullets.push(bullet);
	})

});

const SLEEP_TIME = 20;
function mainLoop(timeUsed = 0) {
	let t = Date.now();

	// Game logic, check if bullet intersects
	PHYSICS.bulletsHit(gamestate);

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
