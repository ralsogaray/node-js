
const express = require('express')

const nodemailer = require("nodemailer");



const port = 1000


const miniOutlook = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'mckenna.langworth@ethereal.email',
        pass: '93SvDHvMSEZKq2xPnV'
    }
});


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


 //plantilla modelo para "endpoints" de express()
app.post("/enviar",function(request, response){ //<<<-------- anatomia modelo de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
    const contacto = request.body 

    
    miniOutlook.sendMail({
        from: contacto.correo, // sender address
        to: "ralsogaray91@hotmail.com", 
        subject: contacto.asunto, // Subject line
        //text: "Hello world?", // plain text body
        html: `<blockquote>${contacto.mensaje}</blockquote>`, // html body
    })


    response.end('desde aca vamos a enviar mail de contacto')
})



