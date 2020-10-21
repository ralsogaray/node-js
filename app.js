const http = require("http")//luego de instalar el module, deposito el modulo en la constante 'http'
const fs = require('fs')// luego de instalar el modulo fs, lo deposito en la constante --> fs = file sisteme


const port = 1000

const server = (request, response) => {//reglas del servidor


    fs.readFile('front/index.html', (error, file) => { // le digo que archivo leer y luego una funcion para indicarle que hacer
        if(error){
            response.writeHead(404, {"content-Type" : "text/plain"}) //codigo de error y digo que es texto
            response.end("Malio Sal(sa)...")
        } else {
            response.writeHead(200, {"Content-Type" : "text/html"})
            response.end(file)
        }
    })  

    
}



http.createServer( server ).listen( port ) //funcion crear servidor, dentro de los () voy a programar las reglas del servidor. El servidor va a escuchar todas las peticiones que entren por el servidor 1000



