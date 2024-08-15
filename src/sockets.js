// conexion socket del servidor

const chatSchema = require('./models/chat');

module.exports = function(io){

    let users = {};

    io.on("connection", async (socket) => { 
        console.log("new user connected");

        const limit = 8
        let offset = 0

        /* leer mensajes anteriores desde la BDD */
        let messages = await chatSchema.find({}).limit(limit)
        const formattedTimes = messages.map(message => {
            return new Date(message.created_at).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
            });
        });

        socket.emit('load old messages', messages, formattedTimes);
        /* ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss */
        socket.on('load more messages', async function() {
            offset += limit
            let messages = await chatSchema.find({})
                .sort({ _id: -1 })
                .skip(offset) // Saltar los mensajes que ya fueron cargados
                .limit(limit); // Limitar la cantidad de mensajes a cargar

            const formattedTimes = messages.map(message => {
                return new Date(message.created_at).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
            });
            socket.emit('display more messages', messages, formattedTimes);
        });
/* ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss */
        /* recibe nickname y callback */
        socket.on('new user', (nickname ,callback)=>{
            if (nickname in users){ /* si existe, no le muestro la interfaz del chat */
                callback(false) ;
            } else { /* si no existe, lo agregamos */
                callback(true);
                socket.nickname = nickname; /* guardamos el nickname en la websocket */
                users[socket.nickname] = socket /* el nuevo usuario tiene la info completa del socket */
                updateNicknames() /* envio todos los usuarios activos al cliente */
            }
        }); 

        /* el servidor escucha el mensaje que se manda desde el cliente y lo reenvia a todos los clientes */
        socket.on('send message', async (data, callback) =>{  /* escucho mensaje del cliente */

            let msg = data.trim();

            /* filtrar mensaje privado o grupal */
            if(msg.substr(0,3) === "/p "){ /* mensaje privado */
                msg = msg.substr(3); /* actualiza mensaje */
                const index = msg.indexOf(' '); 
                if (index != -1){ /* si encuentra ' ' entre nombre y msj  */
                    let name = msg.substr(0,index)/* selecciona el nombre del receptor */
                    msg = msg.substr(index + 1) /* actualiza mensaje */
                    if (name in users){
                        users[name].emit('private', { /* receptor */
                            msg,
                            nick: socket.nickname, /* remitente */
                            time: formatTime()
                        })
                    // Emite el mensaje al remitente (el mismo usuario que envía el mensaje)
                    socket.emit('privateSelf', {
                        msg,
                        from: socket.nickname, // remitente (él mismo)
                        to: name,
                        time: formatTime()
                    });
                    } else {
                        callback('Error! User does not exist')
                    }
                } else { /* NO encuentra ' ' entre nombre y msj */
                    callback('Error! Please enter your message')
                }

                
            } else { /* mensaje grupal */
                /* guardo el mensaje en db */
                var newMsg = new chatSchema({
                    nick: socket.nickname,
                    msg
                });
                await newMsg.save();

                io.sockets.emit('new message', {
                    msg,
                    nick: socket.nickname,
                    time: formatTime()
                }) /* envio datos del nuevo mensaje a todos los sockets */
            }

        });
        
        socket.on('disconnect', data => {
            if(!socket.nickname) return; /* si no encuentra usuario, return */
            delete users[socket.nickname]
            updateNicknames() /* envio todos los usuarios activos al cliente */

        })

        function updateNicknames(){/* envio todos los usuarios activos al cliente */
            io.sockets.emit('usernames', Object.keys(users)) 

        }

        function formatTime(){ /* formateo hora del mensaje en HH:MM */
            const date = new Date()
            const hours = date.getHours().toString().padStart(2, '0'); 
            const minutes = date.getMinutes().toString().padStart(2, '0'); 
            return `${hours}:${minutes}`; 
        }



    });

}