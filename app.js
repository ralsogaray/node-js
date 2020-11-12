//require('dotenv').config() //luego de instalar dotenv.. lo ejecturo en el package.json 
const express = require('express')
const nodemailer = require("nodemailer"); //luego de instalar el module de nodemailer, lo llamo y deposito en la constante
const joi = require('joi')//incluyo el modulo
const expressFileUpload = require("express-fileupload") //luego de instalar el modulo...
const { MongoClient, ObjectId } = require('mongodb') //ACLARAR PARA QUE ES MONGOCLIENT --> extraigo la propiedad MongoClient de mongoDB



const app = express()

const API = express.Router() // <--- desde este momendo, API puede tener sus propias rutas separadas de 'app'
    //API es como un alias de app o un subapp, un minion de app jajaja 
/*
const {HOST_MAIL, 
    PUERTO_MAIL, CASILLA_MAIL,
    CLAVE_MAIL } = process.env */

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


////////////////// CONECTAR A LA DB ///////////////////
const ConnectionString = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_HOST}/${process.env.MONGODB_BASE}?retryWrites=true&w=majority`

const ConnectionDB = async () => {
    
    const client = await MongoClient.connect(ConnectionString, { useUnifiedTopology : true })  //useUnifiedTopology --> es una propiedad que me va a permitir que los mismos métodos que puedo usar de manera generica con una base de datos MongoDb, me puedan servir para otras bases de datos NoSQL y que los metodos funcionen. El Cliente de mongoDB va funcionar en otras bases de datos NoSQL
    
    const db = await client.db('catalogo')

    return db;
}
////////////////// CONECTAR A LA DB /////////////////// 


/*
const miniOutlook = nodemailer.createTransport({ //se configura quien va a hacer el envío de los datos pòr mail
    service: 'gmail',
    auth: {
        user: 'maildeprueba3107@gmail.com',
        pass: 'eant1234'
    }
});*/

app.listen(port)

// -------------- MIDDLEWARES ------------------ // 
app.use( express.static( 'public' ) ) // con esto le digo q primero busque en la carpeta public y si no encuentra lo q busca ahi, buscara en app.js
app.use( express.urlencoded({ extended : true}) ) //PROCESO LOS DATOS ENVIADOS EN URLENCODED y los transformo en un objeto. Convierte de application/x-www-form-urlencoded a objeto
app.use( express.json() )//<-- transforma de aplication/json a objeto. 
app.use( expressFileUpload() )// <---- de "multipart/form-data" a objeto + file.

app.use("/api", API )
// -------------- MIDDLEWARES ------------------ //

/* //plantilla modelo para "endpoints" de express()
app.TIPO_HTTP("/ruta",function(request, response){ <<<-------- //anatomia modelo de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
})*/





API.post("/enviar",(request, response) => { //<<<-------- anatomia modelo de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
    
    const contacto = request.body 
    
    /*
    const { archivo } = request.files // deposito en la constante, la parte 'files' del request enviado; le digo que extraiga del objeto 'files' la propiedad archivo
    
    console.log(archivo) 

    const ubicacion = __dirname + '/public/uploads/' + archivo.name// <---- a donde mandamos los archivos; se pone la ruta completa
                                                        //es archivo.name porque en el input del HTML, se llama archivo; del input se recibe un objeto que representa la imagen
    console.log("Se va a guardar en...")
    console.log(ubicacion)

    //archivo.mv()<--- mv es una funcion para mover archivos. 
    archivo.mv(ubicacion, error => { //le digo archivo, vaya a tal ubicacion; ubicacion la constante! error es por si llega a fallar
        if(error){
            console.log('no se movio')
        }
    })*/
    //return response.end("mira la consolita mono")
    //const validate = schema.validate(contacto) //valido el objeto contacto

    const { error, value } = schema.validate(contacto, { abortEarly : false }); //error y value son objetos, extraigo propiedades de un objeto. Si yo se de antemano que el resultado de validate va a ser propiedad error o propiedad value, los puedo extraer. Al extraerlas, las puedo utilizar despues, como en el If; son constantes/variables sueltas
    //console.log(validate)                 //contacto es el objeto a validar, abortEarly : false --> con esa propiedad recorre todo el objeto contacto y devuelve todos los errores, abort false evita q frene al encontrar el primer error
    
    if( error ){
        //console.log( error ) //para ver como es el objeto error

        const msg = { 
            ok : false,
            error: error.details.map( e => e.message.replace(/"/g, "") )  //con map, recorro el array "details" y extraigo el mensaje, replace lo uso para reemplazar las comillas vacias, lo vamos a ver mas adelante
        }
        response.end( msg )
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

///////////////////////////



app.get("/contacto", function(request, response){  //anatomia de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
    

})





////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////


/*  -------->  API  <----------  */ 


/* /////////////////CREATE /////////////////*/
API.post("/v1/pelicula", async (request, response) => {
    
    const db = await ConnectionDB()

    const respuesta = {
        msg: "Aca vamos a crear peliculas",
    }

    response.json(respuesta) //convierte de objeto a json() --> convierte de objeto a json y lo devuelve como respuesta a la peticion HTTP
})

/* /////////////////READE///////////////// */
API.get("/v1/pelicula", async (request, response) => {
    
    console.log( request.query.id ) // <--- contiene toda la informacion HTTP query enviada 
    
    const db = await ConnectionDB()

    const peliculas = await db.collection('peliculas').find({}).toArray() //con toArray() me devuelve en forma de array las peliculas de la base de datos

    console.log(peliculas)


    
    response.json(peliculas) //convierte de objeto a json() --> convierte de objeto a json y lo devuelve como respuesta a la peticion HTTP
})

API.get("/v1/pelicula/:id", async (request, response) => {


    const {id} = request.params  //exrtraigo el ID de params

    try{
        const db = await ConnectionDB()
        const peliculas = await db.collection('peliculas')

        const busqueda = {
            "_id" : ObjectId( id )  //el ID lo captura de la peticion HTTP
        }

        const resultado = await peliculas.find( busqueda ).toArray()

        return  response.json( {"ok" : "true", resultado })
    } catch(error){
        
        return response.json( {"ok" : "falso", "msg" : "Película no encontrada :("} )

    }


})





/* /////////////////UPDATE///////////////// */
API.put("/v1/pelicula", async (request, response) => {
    //db.getCollection('peliculas').find({})


    const db = await ConnectionDB()

    const peliculas = await db.collection('peliculas')
    
    const respuesta = {
        msg: "Aca vamos a actualizar el listado de peliculas",
    }
    response.json(respuesta) //convierte de objeto a json() --> convierte de objeto a json y lo devuelve como respuesta a la peticion HTTP
})

/*///////////////// DELETE ///////////////////*/
API.delete("/v1/pelicula", async(request, response) => {
    //db.getCollection('peliculas').find({})

    const db = await ConnectionDB()
    
    const respuesta = {
        msg: "Aca vamos eliminar el listado de peliculas",
    }
    response.json(respuesta) //convierte de objeto a json() --> convierte de objeto a json y lo devuelve como respuesta a la peticion HTTP
})
