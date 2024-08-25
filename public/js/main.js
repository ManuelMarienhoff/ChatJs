// Client socket connection setup

$(function() {
    // Establishes and maintains a real-time connection with the server
    const socket = io(); 

    // DOM elements for the message form
    const $messageForm = $('#message-form');
    const $message = $('#message');
    const $chat = $('#chat');

    // DOM elements for the nickname form
    const $nickForm = $('#nick-form');
    const $nickname = $('#nickname');
    const $nickError = $('#nick-error');
    const $usernames = $('#usernames');

    // DOM element for loading more messages
    const $loadMoreButton = $('#loadMore');

    // Load more messages when the button is clicked
    $loadMoreButton.on('click', function() {
        socket.emit('load more messages');
    });
    
    // display message on user connection
    socket.on('user connected', nickname =>{
        $chat.append(`<b> ${nickname} is now online! </b> <br/>`);
    })

    // display message on user disconnection
    socket.on('user disconnected', nickname =>{
        $chat.append(`<b> ${nickname} disconnected </b> <br/>`);
    })

    // Displays more messages received from the server
    socket.on('display more messages', (messages, time, loadedAllMessages) => {
        for (let i = 0; i < messages.length; i++) {
            $chat.prepend(`<p class='error'><b>${messages[i].nick}:</b> ${messages[i].msg} ${time[i]}</p>`);
        }
        if (loadedAllMessages){
            $loadMoreButton.attr('hidden', true);
            alert('There are no more messages to load')
        }
    });

    // Sends the nickname to the server and handles the response
    $nickForm.submit(e => {
        e.preventDefault();
        socket.emit('new user', $nickname.val(), function(dataCallback) {
            if (dataCallback) { // If the nickname is accepted
                $('#nick-wrap').hide();
                $('#content-wrap').show();
            } else { // If the nickname is already taken
                $nickError.html(`
                    <div class='alert alert-danger'>
                    Username already taken
                    </div>`);
            }
            $nickname.val(''); // Clears the nickname input field
        });
    });
    
    // Sends a message from the client to the server
    $messageForm.submit(e => {
        e.preventDefault();
        socket.emit('send message', $message.val(), data => {
            $chat.append(`<p class='error'>${data}</p>`); // Displays an error if there is one
        });  
        $message.val(''); // Clears the message input field
    });

    // Listens for a new message from the server and displays it in the chat
    socket.on('new message', function(data) {
        displayMsg(data);
    });

    // Receives and displays the list of active users from the server
    socket.on('usernames', nicknames => {
        let html = '';
        for (let i = 0; i < nicknames.length; i++) {
            html += `<p><i class='fa fa-user'></i> ${nicknames[i]}</p>`;
        }
        $usernames.html(html);
    });

    // Handles and displays private messages received
    socket.on('private', data => {
        displayOldOrPrivateMsg(data, data.time);
    });

    // Displays the private message sent by the user
    socket.on('privateSelf', data => {
        $chat.append(`<p class='private'><b>${data.from}: private to:</b> ${data.to} ${data.msg} ${data.time}</p>`);
    });

    // Loads and displays old messages from the database
    socket.on('load old messages', (messages, time) => {
        for (let i = 0; i < messages.length; i++) {
            displayOldOrPrivateMsg(messages[i], time[i]);
        }
        if (messages.length < 8) { // Hides the button if there are fewer than 8 messages
            document.getElementById('loadMore').hidden = true;
        }
    });

    // Function to display old or private messages in the chat
    function displayOldOrPrivateMsg(data, time) {
        $chat.append(`<div class="chat-bubble private">
                <div class="chat-header">
                    ${data.nick}
                </div>
                <div class="chat-message">
                    ${data.msg}
                </div>
                <div class="chat-time">${time}</div>
              </div><br/>`);
    }

    // Function to display new messages in the chat
    function displayMsg(data) {
        $chat.append(`<div class="chat-bubble">
                <div class="chat-header">
                    ${data.nick}
                </div>
                <div class="chat-message">
                    ${data.msg}
                </div>
                <div class="chat-time">${data.time}</div>
              </div><br/>`);
    }

    /* Handles clear chat command */
    socket.on('clear chat', ()=>{
        $chat.html('');
    });
});
