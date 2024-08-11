const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server); /* conexion de web socket, tiene a todos los sockets conectados*/

const mongoose = require('mongoose');

/* db connection */
mongoose.connect('mongodb://localhost/chat-database')
.then(db => console.log('db is connected'))
.catch(error => console.log(error))

/* settings */
app.set('port', process.env.PORT || 3000);

/* cuando se conecte un nuevo socket */
require("./sockets")(io);

/* Use Static files */
app.use(express.static('public'));

/* Initializing server */
server.listen(app.get("port"), () => {
    console.log(`Server on port ${app.get("port")}`);
});
