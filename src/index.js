// Import the necessary modules
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // Create an HTTP server using the Express app
const io = new Server(server); // Initialize a new instance of socket.io by passing the HTTP server

const mongoose = require('mongoose'); // Import Mongoose for MongoDB interactions
require('dotenv').config(); // Load environment variables from a .env file

/* Database connection */
mongoose.connect(process.env.MONGO_URI)
    .then(db => console.log('Database connected successfully')) 
    .catch(error => console.log('Database connection error:', error)); 

/* Server settings */
app.set('port', process.env.PORT || 3000); 

/* Handle socket connections */
require("./sockets")(io); // Pass the io instance to the sockets module to handle real-time connections

/* Static files */
app.use(express.static('public'));

/* Start the server */
server.listen(app.get("port"), () => {
    console.log(`Server running on port ${app.get("port")}`);
});
