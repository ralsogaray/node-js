//require('dotenv').config() //luego de instalar dotenv.. lo ejecturo en el package.json <-- MODULO PARA VARIABLES DE ENTORNO
const express = require('express')
const nodemailer = require("nodemailer"); //luego de instalar el module de nodemailer, lo llamo y deposito en la constante
const joi = require('joi')// <--- MODULO PARA HACER ESQUEMAS DE VALIDACIONES  
const expressFileUpload = require("express-fileupload") // <---- MODULO PARA ENVIAR ARCHIVOS A TRAVES DEL FORM
const { MongoClient, ObjectId } = require('mongodb') //ACLARAR PARA QUE ES MONGOCLIENT --> extraigo la propiedad MongoClient de mongoDB
// extraigo del modulo mongoDB el objeto "ObjectID"
const cookieParser = require('cookie-parser') // modulo para crear y leer cookies

const jwt = require('jsonwebtoken')// <---- MODULO PARA CREAER TOKENS!

const bcrypt = require('bcrypt'); // <--encriptador de contraseñas

const app = express() //<-- DEPOSITO EXPRESS EN APP 

const API = express.Router() // <--- desde este momendo, API puede tener sus propias rutas separadas de 'app'
    //API es como un alias de app o un subapp, un minion de app  


const port = 1000

//SE DEPOSITA EN MINIOUTLOOK LA CONFIGURACION PARA QUE NODEMAILER ENVIE EL MAIL
const miniOutlook = nodemailer.createTransport({ 
    host: process.env.HOST_MAIL, 
    port: process.env.PUERTO_MAIL,
    auth: {
        user: process.env.CASILLA_MAIL,
        pass: process.env.CLAVE_MAIL
    }
});

//ESQUEMA PARA VALIDAD EL FORMULARIO MEDIANTE EL MODULO JOI
const schema = joi.object({ // se crea el objeto y se desposita en schema
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
    //await client.close() -- por que no anda??
    return db;
    
}
///////////////////////////////////// 



/////////////// VERIFICAR TOKEN /////////////
const verifyToken = (request, response, next) => { //next representa la ejecución de la siguiente función
    const { _auth } = request.cookies //extraigo el token que se llama "_auth" y lo deposito en _auth
    
    //jwt.verify(TOKEN, PALABRA-SECRETA, CALLBACK) <------ ANATOMIA PARA VERIFICAR TOKEN

    jwt.verify( _auth, process.env.JWT_SECRET, (error, data) =>{ //si el token es valido, en "data" esta la info encriptada en el token (naim, email y user id)
        if(error){
            response.end("ERROR: TOKEN EXPIRADO O INVALIDO!")
        } else{
            next() //con next() avanza para operar la funcion que sigue
        }
    })
}
/////////////////////////////////

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
app.use( cookieParser() ) // para usar el modulo cookieParser instalado

app.use("/api", API )
// -------------- MIDDLEWARES ------------------ //

/* //plantilla modelo para "endpoints" de express()
app.TIPO_HTTP("/ruta",function(request, response){ <<<-------- //anatomia modelo de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
})*/




// ENVIO DE CORREO ELECTRONICO
API.post("/enviar",(request, response) => { //<<<-------- anatomia modelo de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
    
    const contacto = request.body 
    
    
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
    })
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


//  ------------------------>  API  <------------------------  


/* ///////////////// ----< CREATE >----/////////////////*/

API.post("/v1/pelicula", async (request, response) => {
    
    const pelicula = request.body //datos capturados de la peticion http de tipo post

    try{
        const db = await ConnectionDB() //conecto a la base

        const peliculas = await db.collection('peliculas') //accedo a la colección de la base de datos 
    
        const { result } = await peliculas.insertOne( pelicula ) // fucion insertOne para insertar en la coleccion la pelicula enviada por la peticion post. La operación insertOne arroja un resultado, entonces extraigo el resultado
    
        const { ok } = result // extraigo la propiedad "ok" del objeto result; si ok == 1 es que se subió correctamente la pelicula a la coleccion 
        
        //console.log( result )
    
        const respuesta = {
            ok,
            msg: (ok == 1) ? "Pelicula guardada correctamente" : "Error al guardar la película" //<-- "operador ternario"; es un if mas ninja. Si ok == 1 retorna el primer mensaje, sino (else), el segundo
        }
        return response.json(respuesta) //convierte de objeto a json() --> convierte de objeto a json y lo devuelve como respuesta a la peticion HTTP
    } catch{
        return response.json( {"ok" : false, "msg" : "La pelicula no fue agregada :("} )
    }
})



/* ///////////////// ----< READE ALL>-----///////////////// */
API.get("/v1/pelicula", async (request, response) => { //verifyToken
    
    console.log( request.query.id ) // <--- contiene toda la informacion HTTP query enviada. Los datos "query string" enviados mediante la petición HTTP son capturados mediante la propiedad query y se disponen como un objeto, POR ESO request.query.id --> Extraigo el Id del query
    
    try{   
        const db = await ConnectionDB()

        const peliculas = await db.collection('peliculas').find({}).toArray() //con toArray() me devuelve en forma de array las peliculas de la base de datos
    
        console.log(peliculas)
    
        return response.json(peliculas) //convierte de objeto a json() --> convierte de objeto a json y lo devuelve como respuesta a la peticion HTTP
    }catch(error){
        return response.json( {"ok" : false, "msg" : "Películas no encontrada :("} )
    }
})

/* ///////////////// ----< READE ONE >-----///////////////// */
API.get("/v1/pelicula/:id", async (request, response) => { //al poner ID en la ruta, accedo a la pelicula de la base de datos que corresponda segun el ID ingresado en la peticion HTTP. Reconoe que es ID por el /:id, si pusiere otra palabra como "codigo" buscaria la pelicula por codigo (no hay)

    const { id } = request.params  //exrtraigo el ID de params que es lo que envia la peticion http. "Params" es el objeto que contiene todos los parametors que configuramos en la URL ":/id"; si agregase ":/cosa/:sandijuela" en params va a haber una propiedad cosa y una sandijuela 

    try{
        const db = await ConnectionDB() //conecto a la DB
        const peliculas = await db.collection('peliculas') //accedo a la coleccion de peliculas

        const busqueda = { "_id" : ObjectId( id ) } //ejecuto la funcion ObjectId que surge de la coleccion en mongoDB para poder acceder a la pelicula correspondiente  

        const resultado = await peliculas.find( busqueda ).toArray() //con find voy a buscar lo que configure en mi objeto busqueda, es decir el ID enviado en la peticion HTTP, y una vez encontrado que lo convierta a una array de objetos

        return  response.json( {"ok" : true, resultado }) //me da por respuesta en formato json el resultado 

    } catch(error){
        
        return response.json( {"ok" : false, "msg" : "Película no encontrada :("} )
    }
})





/* /////////////////UPDATE///////////////// */
API.put("/v1/pelicula/:id", async (request, response) => {
    
    const { id } = request.params  //exrtraigo el ID de params que es lo que envia la peticion http para hacer la busqueda de la pelicula con ID
    
    const pelicula = request.body // para hacer la actualización correspondiente

    try{
        const db = await ConnectionDB()

        const peliculas = await db.collection('peliculas')

        const busqueda = { "_id" : ObjectId( id ) } //el ID lo captura de la peticion HTTP
        
        const nuevaData = { //objeto auxiliar para pasar como parámetro en updateOne(), va a llevar acabo el proceso de actualizacion
            $set : {            //"$set" asi se escribe la propiedad. 
                //aca van las propiedades que se van a actualizar
                ...pelicula // "..." asignacion por destructuracion!! Los "..." rompen el objeto y convierten todas sus propiedades en variables sueltas. Le asigno al objeto lo que tiene pelicula pero solo lo asignado a pelicula. Extraigo las propiedades del objeto. Si envie solo una propiedad, solo se va a actualizar la enviada, si envie varias, todas las enviadas
            }
        } 
        const { result } = await peliculas.updateOne(busqueda, nuevaData) // busqueda es el ID, nuevaData va a ser un nuevo objeto que va a reemplazar al viejo
        
        const { ok } = result
        
        const respuesta = {
            ok,
            msg: (ok == 1) ? "Pelicula actualizada correctamente" : "Error al actualizar la película"
        }
        return response.json(respuesta) //convierte de objeto a json() --> convierte de objeto a json y lo devuelve como respuesta a la peticion HTTP
    } catch (error){
        return response.json( {"ok" : false, "msg" : "Película no actualizada :("} )
    }
})

/*///////////////// DELETE ///////////////////*/
API.delete("/v1/pelicula/:id", async(request, response) => {

    const { id } = request.params 

    try{
        const db = await ConnectionDB()
        const peliculas = await db.collection('peliculas')

        const eliminar = { "_id" : ObjectId( id ) }

        const { result } = await peliculas.deleteOne( eliminar )
        const { ok } = result
    
        const respuesta = { 
        ok, 
        msg: (ok == 1) ? "Pelicula eliminada correctamente" : "Error al eliminar la película, HELP!"
        }
        return response.json(respuesta) 
    } catch(error){
        return response.json( {"ok" : "falso", "msg" : "error :("} )
    }
})


/********* REGISTER ***********/

API.post("/v1/register", (request, response) =>{ //crear proceso de registro - usar postman
    const { name, email, pass } = request.body

    const saltRounds = 10; //<-- CONFIGURACION ESPECIAL PARA LAS CONTRASEÑAS. Le agrega caracteres especiales a la contraseña encriptada. Esos caracteres van a servir para comparar una password q esta entrando con la ya guardada en la DB
    
    //USO LA LIBRERIA BCRYPT sumado al metodo hash()
    bcrypt.hash(pass, saltRounds, async (error, hash) =>{ // pass seria la contraseña en formato plano que llego por el form, le asigno a la contraseña el condimento (salt); luego el call back que captura el error y si no hay error va a obtener el hash (contraseña encriptada)

        if(error){
            console.log("La pass no se encriptó!")
        } else{
            console.log("Tengo las password encriptada, es la siguiente:")
            console.log( hash )

            const usuario = {
                name: name,
                email: email,
                pass: hash
            }
            
            try{
                const db = await ConnectionDB() 
                const peliculas = await db.collection('usuarios')  
                const { result } = await peliculas.insertOne( usuario ) 
                const { ok } = result // extraigo la propiedad "ok" del objeto result; si ok == 1 es que se subió correctamente la pelicula a la coleccion 
            
                const respuesta = {
                    ok,
                    msg: (ok == 1) ? "Usuario guardado correctamente" : "Error al guardar usuario" //<-- "operador ternario"; es un if mas ninja. Si ok == 1 retorna el primer mensaje, sino (else), el segundo
                }
                return response.json(respuesta) //convierte de objeto a json() --> convierte de objeto a json y lo devuelve como respuesta a la peticion HTTP
            } catch{
                return response.json( {"ok" : false, "msg" : "Usuario no fue guardado por algún error en el código :("} )
            }
        } 
        response.end("Mira la consola!")
    })
})


/*/////////////// AUTENTICACION //////////////*/ 

API.post("/v1/auth", (request, response) => {
    
    //const rta = new object()
    
    const { mail, pass} = request.body

    const userDB = {
        "_id" : ObjectId("5fc6cedff27b21c0c74ee1a1"),
        "name" : "han Solapa",
        "email" : "han_skeleton@eant.tech",
        "pass" : "$2b$10$bzmPf30qk/xUFX7LH9ayBeSuiBxxhr6JeuEG3jt5eH8NIZcxXi9oC"
    }

    bcrypt.compare(pass, userDB.pass,(error, result) =>{ //metodo para comparar la password en la DB con la enviada en el form; "pass" es la contraseña plana que enviaron por el formulario; "hash" es la contraseña encriptada guardada en la DB
        console.log(result)
        if( error ){
            return response.json( { auth : false, msg: "No pudimos verificar tu pass"})
        
        } else if(result == false){ // resultado es si la contraseña coincide o no
            
            return response.json({ auth : false, msg: "La pass no coincide"})
        } else{
            // SI LA PASS COINCIDE SE VA A GENERAR EL TOKEN 
            //const token = jwt.sign(PAYLOAD, CONFIGS, secretKey ) <---- anatomia para ejecutar la funcion JWT
            
            //sign == firmar!
            const token = jwt.sign({ email: userDB.email, name: userDB.name, expiresIn : 60 * 60}, process.env.JWT_SECRET ) //expiresIn es para decir cuando expira el token; PAYLOAD es la informacion que nosotros queremos guardar codificadamente ; ultimo esta la palabra clave para poder encriptar y generar el token
    
            //console.log( token )
            
            // response.cookie( NOMBRE, CONTENT, CONFIG) <--- anatomia : NOMBRE es nombre de la cookie; content es el token;

            // SE CREA LA COOKIE Y SE ANEXA AL RESPONSE, EL RESPONSE VA A DEVOLVER UN JSON
            response.cookie( "_auth", token, { //response.cookie para guardar el token en una cookie
                expires     : new Date( Date.now() + 1000 * 60 * 3 ), // fecha que expira la cookie, 3 minutos y expira. El navegador va a guardar el token por 3 minutos
                httpOnly    : true, // "true" JS no puede leerlo y ni usarlo, si pongo "false" JS puede leerlo
                sameSite    : 'Lax', //configuro si permito que la cookie pueda enviarse a otros dominios web o no; valores "Strict" : solo puede leer la cookie el mismo dominio que la invento, "none" ; "Lax" permite leer la cookie el dominio principal y subdminios que pertenezcan al dominio personal; "None": la cookie puede leerla cualquier dominio
                secure      : false //configuro si la cookie se envía solamente por HTTPS(segura) o http clasica (no segura). Al estar en localhost hay que poner en false para poder interactuar, cuando ponga la aplicacion online hay que poner true para que sea seguro
            })
            return response.json( { auth : true, msg: "pass coincide"})
        }
    })
    
    //response.json( rta )
})

// how to set time zone en mi scriopt .. modulo set-tz
// meetupjs.com.ar  --> comunidad de programadores
// frontend.cafe    --> comunidad de programadores

