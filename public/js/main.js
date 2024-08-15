// conexion socket del cliente

$(function(){
    const socket = io(); /* mantiene conexion en tiempo real con el sevidor */

    /* obtaining DOM elemens from the interface */
    const $messageForm = $('#message-form');
    const $message = $('#message');
    const $chat = $('#chat');

    /* obtaining DOM elemens from the nickname form */
    const $nickForm = $('#nick-form');
    const $nickname = $('#nickname');
    const $nickError = $('#nick-error');
    const $usernames = $('#usernames');

    /* obtaining DOM elements */
    const $loadMoreButton = $('#loadMore');

    $loadMoreButton.on('click', function() {
        socket.emit('load more messages');
    });
    
    socket.on('display more messages', (messages,time)=>{
        for (let i = 0; i < messages.length; i++){
            $chat.prepend(`<p class='error'><b>${messages[i].nick}:</b> ${messages[i].msg} ${time[i]}</p>`)
        }
    })

    $nickForm.submit(e=>{
        e.preventDefault();
        socket.emit('new user', $nickname.val(), function(dataCallback){ /* envia al servidor nickname y callback */
            if(dataCallback){ /* si existe el usuario, ocultamos interfaz nickname y mostramos chat */
                $('#nick-wrap').hide();
                $('#content-wrap').show();
            } else {
                $nickError.html(`
                    <div class='alert alert-danger'>
                    Username already taken
                    </div>`);
            }
            $nickname.val('');
        });
    });
    
    /* events */
    /* envio datos desde el cliente al servidor como 'send message' */
    $messageForm.submit(e=>{
        e.preventDefault();
        socket.emit('send message', $message.val(), data => {
            $chat.append(`<p class='error'> ${data}</p>`)
        });  
        $message.val('')
    })

    /* Escucho el mensaje que viene desde el servidor */
    socket.on('new message', function(data){
        displayMsg(data)
    } )

    /* Recibo todos los usuarios activos del servidor */
    socket.on('usernames', nicknames =>{
        let html = '';
        for (let i=0; i < nicknames.length; i++){
            html += `<p><i class='fa fa-user'></i> ${nicknames[i]}</p>`
        }
        $usernames.html(html)
    })

    /* Escucho mensaje privado desde el servidor para mostrar al receptor*/
    socket.on('private', data => {
        displayOldOrPrivateMsg(data, data.time)
    })
    /* escucho mensaje privado desde el servidor y se lo muestro al remitente */
    socket.on('privateSelf', data => {
        $chat.append(`<p class='private'><b>${data.from}: private to: </b> ${data.to} ${data.msg} ${data.time}</p>`)
    })

    /* cargar viejos mensajes de la BDD */
    socket.on('load old messages', (messages, time) => {
        for (let i = 0; i < messages.length; i++){
            displayOldOrPrivateMsg(messages[i], time[i])
        }
        if (messages.length < 8) {
            document.getElementById('loadMore').hidden = true;
        }
    })


    function displayOldOrPrivateMsg(data, time){
        $chat.append(`<p class='private'><b>${data.nick}:</b> ${data.msg} ${time}</p>`)
    }

    function displayMsg(data){
        $chat.append(`<b> ${data.nick}</b>: ` + data.msg + ` ${data.time}` + '<br/>')
    }

})