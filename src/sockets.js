// conexion de socket del servidor

module.exports = function(io){

    io.on("connection", (socket) => { 
        console.log("new user connected");

        /* el servidor escucha el mensaje que se manda desde el cliente y lo reenvia a todos los clientes */
        socket.on('send message', function(data){  /* escucho mensaje del cliente */
            io.sockets.emit('new message', data) /* envio datos a todos los sockets */
        })
        

    });
}