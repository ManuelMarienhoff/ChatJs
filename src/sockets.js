// conexion socket del servidor

module.exports = function(io){

    let nicknames = [];


    io.on("connection", (socket) => { 
        console.log("new user connected");

        /* recibe nickname y callback */
        socket.on('new user', (nickname ,callback)=>{
            if (nicknames.indexOf(nickname) >= 0){ /* si existe, no le muestro la interfaz del chat */
                callback(false) ;
            } else { /* si no existe, lo agregamos */
                callback(true);
                socket.nickname = nickname; /* guardamos el nickname en la websocket */
                nicknames.push(socket.nickname);
                updateNicknames() /* envio todos los usuarios activos al cliente */
            }
        }); 

        /* el servidor escucha el mensaje que se manda desde el cliente y lo reenvia a todos los clientes */
        socket.on('send message', data =>{  /* escucho mensaje del cliente */
            io.sockets.emit('new message', {
                msg: data,
                nick: socket.nickname
            }) /* envio datos del nuevo mensaje a todos los sockets */
        });
        
        socket.on('disconnect', data => {
            if(!socket.nickname) return; /* si no encuentra usuario, return */
            nicknames.splice(nicknames.indexOf(socket.nickname), 1); /* si encuentra, lo elimina del server*/
            updateNicknames() /* envio todos los usuarios activos al cliente */

        })

        function updateNicknames(){
            io.sockets.emit('usernames', nicknames) /* envio todos los usuarios activos al cliente */

        }

    });
}