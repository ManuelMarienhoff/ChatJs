// conexion de socket del cliente

$(function(){
    const socket = io(); /* mantiene conexion en tiempo real con el sevidor */

    /* obtaining DOM elemens from the interface */
    const messageForm = $('#message-form');
    const message = $('#message');
    const chat = $('#chat');

    /* events */
    messageForm.submit(e=>{
        e.preventDefault();
        socket.emit('send message', message.val());  /* envio datos desde el cliente al servidor como 'send message' */
        message.val('')
    })

    /* Escucho el mensaje que viene desde el servidor */
    socket.on('new message', function(data){
        chat.append(data + '<br/>')
    } )

})