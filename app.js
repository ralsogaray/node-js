
const express = require('express')



const port = 1000


const app = express()

app.listen(port)
/* //plantilla modelo para "endpoints" de express()
app.TIPO_HTTP("/ruta",function(request, response){ <<<-------- //anatomia modelo de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo

})*/

app.get("/contacto", function(request, response){  //anatomia de como crear rutas en mi servidor con express. Esta el tipo de peticion y la ruta con la cual se va a acceder al codigo
    response.end(`DESDE ACA VAMOS A CONTACTARNOS`)
})



