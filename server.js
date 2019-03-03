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

io.on('connection', function(socket){
	console.log('a user connected');
	users[socket.id] = socket;
	socket.on("disconnect", function() {
		delete users[socket.id];
	});
});

const SLEEP_TIME = 15;
function mainLoop(timeUsed = 0) {
	let t = Date.now();
	io.emit('update', {
		msg: 'broadcast'
	});
	t = Date.now() - t;
	setTimeout(function() {
		mainLoop(t);
	}, SLEEP_TIME - timeUsed);
}

mainLoop();