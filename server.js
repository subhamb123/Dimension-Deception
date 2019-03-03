// Setup basic express server
const express = require("express");
const app = express();
const path = require("path");
const server = require("http").createServer(app);
var io = require("socket.io")(server);
const port = process.env.PORT || 3000;

server.listen(port, () => {
	console.log("Server listening at port %d", port);
});

// Routing
app.use(express.static(path.join(__dirname, "client")));

let users = {};

const GAMESTATE = require('./gamestate.js');
let gamestate = {players: {}, bullets: [], ticks: 0};
const PHYSICS = require('./physics');



io.on('connection', function(socket){
	console.log('a user connected');
	users[socket.id] = socket;
	socket.on("disconnect", function() {
		delete users[socket.id];
	});
	socket.on('addplayer', function(data){
		gamestate.players[socket.id] = GAMESTATE.createPlayer(data.name);
	});
	socket.on('playermove', function(data) {
		gamestate.players[socket.id] = data.player;
	});
	socket.on('playershoot', function(data){
		data.bullet.damage = 5;
		gamestate.bullets.push(data.bullet);
	})

});

const SLEEP_TIME = 15;
function mainLoop(timeUsed = 0) {
	let t = Date.now();
	//Game logic, check if bullet intersects
	PHYSICS.bulletsHit(gamestate);


	io.emit('update', {
		gamestate: gamestate
	});
	t = Date.now() - t;
	setTimeout(function() {
		mainLoop(t);
	}, SLEEP_TIME - timeUsed);
	gamestate.ticks++;
}

mainLoop();

