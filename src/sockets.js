// Server-side socket connection

// Import the chat schema model for database interactions
const chatSchema = require('./models/chat');

module.exports = function(io) {

    let users = {}; // Object to store connected users

    // Listen for incoming socket connections from clients
    io.on("connection", async (socket) => { 

        const limit = 8;  // Number of messages to load initially
        let offset = 0;   // Offset for loading additional messages

        // Load initial set of messages from the database
        let messages = await chatSchema.find({}).limit(limit);
        const formattedTimes = messages.map(message => {
            return new Date(message.created_at).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
            });
        });

        // Send initial messages to the connected client
        socket.emit('load old messages', messages, formattedTimes);
        
        // Load more messages upon client request
        socket.on('load more messages', async function() {
            offset += limit;
            let messages = await chatSchema.find({})
                .sort({ _id: -1 })  // Sort by most recent messages
                .skip(offset)       // Skip already loaded messages
                .limit(limit);      // Limit the number of messages to load
            let loadedAllMessages = messages.length < limit 
            const formattedTimes = messages.map(message => {
                return new Date(message.created_at).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
            });
            socket.emit('display more messages', messages, formattedTimes, loadedAllMessages);
        });

        // Handle new user login
        socket.on('new user', (nickname, callback) => {
            if (users[nickname]) {  // Check if the nickname is already in use
                callback(false);
            } else {  // If nickname is not taken, proceed with login
                callback(true);
                socket.nickname = nickname;  // Assign the nickname to the socket
                users[socket.nickname] = socket;  // Store user info in the users object
                updateNicknames();  // Send updated list of active users to all clients
                io.emit('user connected', nickname)
            }
        }); 

        // Handle message sending
        socket.on('send message', async (data, callback) => {  
            let msg = data.trim();

            // Handle private messages
            if (msg.startsWith("/p ")) {  // Check if message is private
                msg = msg.slice(3);  // Remove the '/p ' prefix
                const index = msg.indexOf(' '); 
                if (index !== -1) {  // Ensure there's a recipient and a message
                    let name = msg.slice(0, index);  // Extract recipient's name
                    msg = msg.slice(index + 1);  // Extract the message
                    if (users[name]) {
                        // Send private message to the recipient
                        users[name].emit('private', {
                            msg,
                            nick: socket.nickname,  // Sender's nickname
                            time: formatTime()
                        });
                        // Send confirmation of private message to the sender
                        socket.emit('privateSelf', {
                            msg,
                            nick: socket.nickname,  // Sender's nickname
                            to: name,  // Recipient's name
                            time: formatTime()
                        });
                    } else {
                        callback('Error! User does not exist');
                    }
                } else {
                    callback('Error! Please enter your message');
                }
            } else if(msg === "/clear"){ /* Handle clear chat command */
                socket.emit("clear chat")
            } else {  // Handle group messages
                // Save the message to the database
                const newMsg = new chatSchema({
                    nick: socket.nickname,
                    msg
                });
                await newMsg.save();

                // Broadcast the new message to all clients
                io.sockets.emit('new message', {
                    msg,
                    nick: socket.nickname,
                    time: formatTime()
                });
            }

        });
        
        // Handle user disconnection
        socket.on('disconnect', () => {
            if (!socket.nickname) return;  // If no nickname, do nothing
            delete users[socket.nickname];  // Remove user from the users object
            updateNicknames();  // Send updated list of active users to all clients
            io.emit('user disconnected', socket.nickname)
        });

        // Function to send the list of active users to all clients
        function updateNicknames() {
            io.sockets.emit('usernames', Object.keys(users)); 
        }

        // Function to format the message time as HH:MM
        function formatTime() {
            const date = new Date();
            const hours = date.getHours().toString().padStart(2, '0'); 
            const minutes = date.getMinutes().toString().padStart(2, '0'); 
            return `${hours}:${minutes}`; 
        }

    });

}
