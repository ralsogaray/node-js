//require('dotenv').config() //luego de instalar dotenv.. lo ejecturo en el package.json 
const express = require('express')
const nodemailer = require("nodemailer"); //luego de instalar el module de nodemailer, lo llamo y deposito en la constante
const joi = require('joi')//incluyo el modulo
const expressFileUpload = require("express-fileupload") //luego de instalar el modulo...

const app = express()

const port = 1000


const miniOutlook = nodemailer.createTransport({ //se configura quien va a hacer el envío de los datos pòr mail
    host: process.env.HOST_MAIL, 
    port: process.env.PUERTO_MAIL,
    auth: {
        user: process.env.CASILLA_MAIL,
        pass: process.env.CLAVE_MAIL
    }
});

const schema = joi.object({ //esquema para validar el formulario
    nombre  : joi.string().max(30).required(),//digo que el dato es un string
    apellido: joi.string().max(30).required(),
    correo  : joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'tech'] }}).required(), //segmentos que tiene que tener el mail y los dominios permitidos
    asunto  : joi.number().integer().required(),
    mensaje : joi.string().max(100).required(),
    archivo : joi.string().required()
})

/*
const miniOutlook = nodemailer.createTransport({ //se configura quien va a hacer el envío de los datos pòr mail
    service: 'gmail',
    auth: {
        user: 'maildeprueba3107@gmail.com',
        pass: 'eant1234'
    }
});*/

app.listen(port)
// -------------- MIDDLEWARES ------------------ 

app.use( express.static( 'public' ) ) // con esto le digo q primero busque en la carpeta public y si no encuentra lo q busca ahi, buscara en app.js
app.use( express.urlencoded({ extended : true}) ) //PROCESO LOS DATOS ENVIADOS EN URLENCODED y los transformo en un objeto. Convierte de application/x-www-form-urlencoded a objeto
app.use( express.json() )//<-- transforma de aplication/json a objeto. 
app.use( expressFileUpload() )// <---- de "multipart/form-data" a objeto + file.


/* //plantilla modelo para "endpoints" de express()
app.TIPO_HTTP("/ruta",function(request, response){ <<<-------- //anatomia modelo de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
})*/

app.get("/contacto", function(request, response){  //anatomia de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
    //response.end(`DESDE ACA VAMOS A CONTACTARNOS`)

})



app.post("/enviar",(request, response) => { //<<<-------- anatomia modelo de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
    
    const contacto = request.body 
    const { archivo } = request.files // deposito en la constante, la parte archivo de los files 
    
    //console.log(archivo) 

    const ubicacion = __dirname + '/public/uploads/' + archivo.name// <---- a donde mandamos los archivos

    console.log(ubicacion)

    archivo.mv(ubicacion, error => { //le digo archivo, vaya a tal ubicacion
        if(error){
            console.log('no se movio')
        }
        
    }) 


    return response.end("mira la consolita mono")

    //const validate = schema.validate(contacto) //valido el objeto contacto

    const { error, value } = schema.validate({ contacto }); //error y value son objetos
    //console.log(validate)
    
    if( error ){
        console.log(error)

        const msg = {
            error: error.details.map( e => { //e representa elemento del map
                console.log(e.message)
            }) //funciona como for each `pero construye un nuevo array con datos
        }

        response.end(error.details[0].message)
    } else {
        miniOutlook.sendMail({
            from: contacto.correo, // sender address 
            to: "rodrigo.alsogaray91@gmail.com",  // quien recibe
            replyTo: contacto.correo,//a quien responderle el mail (en gmail no me funcionó)
            subject: `Asunto ${contacto.asunto}, mail de contacto -> ${contacto.correo}`, // asunto
            //text: "Hello world?", // plain text body --> para enviar en modo texto plano..
            html: `<blockquote>${contacto.mensaje}</blockquote>, archivo enviado ---> ${contacto.archivo}`, // html body --> para enviar en formato HTML
        })
        response.end('correo electronico enviado, Sr. Admin.')
    }
    
})



