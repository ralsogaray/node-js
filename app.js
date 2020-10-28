//require('dotenv').config()
const express = require('express')
const nodemailer = require("nodemailer"); //luego de instalar el module de nodemailer, lo llamo y deposito en la constante
const port = 1000


const miniOutlook = nodemailer.createTransport({ //se configura quien va a hacer el envío de los datos pòr mail
    host: process.env.HOST_MAIL, 
    port: process.env.PUERTO_MAIL,
    auth: {
        user: process.env.CASILLA_MAIL,
        pass: process.env.CLAVE_MAIL
    }
});
/*
const miniOutlook = nodemailer.createTransport({ //se configura quien va a hacer el envío de los datos pòr mail
    service: 'gmail',
    auth: {
        user: 'maildeprueba3107@gmail.com',
        pass: 'eant1234'
    }
});*/


const app = express()

app.listen(port)

app.use( express.static( 'public' ) ) // con esto le digo q primero busque en la carpeta public y si no encuentra lo q busca ahi, buscara en app.js

app.use( express.urlencoded({ extended : true}) ) //PROCESO LOS DATOS ENVIADOS EN URLENCODED y los transformo en un objeto 

/* //plantilla modelo para "endpoints" de express()
app.TIPO_HTTP("/ruta",function(request, response){ <<<-------- //anatomia modelo de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
})*/

app.get("/contacto", function(request, response){  //anatomia de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
    //response.end(`DESDE ACA VAMOS A CONTACTARNOS`)

})



app.post("/enviar",(request, response) => { //<<<-------- anatomia modelo de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
    
    const contacto = request.body 

    miniOutlook.sendMail({
        from: contacto.correo, // sender address --> contacto.correo es por **** 
        to: "rodrigo.alsogaray91@gmail.com",  // quien recibe
        replyTo: contacto.correo,
        subject: `Asunto ${contacto.asunto}, mail de contacto -> ${contacto.correo}`, // Subject line
        //text: "Hello world?", // plain text body --> para enviar en modo texto plano..
        html: `<blockquote>${contacto.mensaje}</blockquote>`, // html body --> para enviar en formato HTML
    })

    response.end('correo electrónico enviadp, Sr. Admin.')
})



