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
        $chat.append(`<b> ${data.nick}</b>: ` + data.msg + '<br/>')
    } )

    /* Recibo todos los usuarios activos del servidor */
    socket.on('usernames', nicknames =>{
        let html = '';
        for (let i=0; i < nicknames.length; i++){
            html += `<p><i class='fa fa-user'></i> ${nicknames[i]}</p>`
        }
        $usernames.html(html)
    })

    /* Escucho mensaje privado desde el servidor */
    socket.on('private', data => {
        $chat.append(`<p class='private'><b>${data.nick}:</b> ${data.msg}</p>`)
    })
})