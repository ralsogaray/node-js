const http = require("http")//luego de instalar el module, deposito el modulo en la constante 'http'

const port = 1000

const server = (request, response) => {//reglas del servidor

    response.end("Hello world!")
}



http.createServer( server ).listen(port) //funcion crear servidor, dentro de los () voy a programar las reglas del servidor. El servidor va a escuchar todas las peticiones que entren por el servidor 1000



