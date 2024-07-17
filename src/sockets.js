/* cuando se conecte un nuevo socket */

module.exports = function(io){
    
    io.on("connection", (socket) => { 
        console.log("new user connected");
    });
}