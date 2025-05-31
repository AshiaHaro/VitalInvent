const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer');
const xlsx = require('xlsx');
require('dotenv').config();
app.use(bodyParser.urlencoded({ extended: true }));
// Configuración de la sesión
app.use(session({
  secret: 'secretKey',
  resave: false,
  saveUninitialized: false,
}));
// Configurar conexión a MySQL
const connection = mysql.createConnection({
    host: process.env.DB_HOST,       // Host desde .env
    user: process.env.DB_USER,       // Usuario desde .env
    password: process.env.DB_PASS, 
    database: process.env.DB_NAME 
  });
  connection.connect(err => {
    if (err) {
      console.error('Error conectando a MySQL:', err);
      return;
    }
    console.log('Conexión exitosa a MySQL');
  });
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Carpeta donde se guardarán los archivos
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Nombre del archivo
    }
});
const upload = multer({ storage: storage });
// Middleware para verificar el inicio de sesión
function requireLogin(req, res, next) {
  if (!req.session.user) {
      return res.redirect('/login');
  }
  next();
}
// Middleware para verificar el rol
function requireRole(roles) {
  return (req, res, next) => {
      console.log('Usuario en sesión:', req.session.user); // Verifica el usuario en sesión
      if (req.session.user && roles.includes(req.session.user.tipo_usuario)) {
          return next();
      }
      let html = `
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
          <style>
              /* Reset de estilos */
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
  
              body {
                  font-family: 'Arial', sans-serif;
                  line-height: 1.6;
                  background-color: #f4f4f4;
                  color: #333;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
              }
  
              .container {
                  width: 80%;
                  max-width: 400px;
                  margin: auto;
                  padding: 20px;
                  background: #ffffff;
                  border-radius: 5px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  text-align: center;
              }
  
              h1 {
                  color: #e74c3c; /* Color rojo para el título */
                  margin-bottom: 10px;
              }
  
              p {
                  margin: 15px 0;
                  font-size: 1.2em;
              }
  
              .btn {
                  padding: 10px 20px;
                  background: #35424a; /* Fondo del botón */
                  color: #ffffff; /* Color del texto */
                  border: none; /* Sin borde */
                  border-radius: 5px; /* Bordes redondeados */
                  cursor: pointer; /* Cambia el cursor al pasar el mouse */
                  transition: background 0.3s; /* Transición suave para el fondo */
                  text-decoration: none; /* Eliminar subrayado */
              }
  
              .btn:hover {
                  background: #506471; /* Color de fondo al pasar el mouse */
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Acceso Denegado</h1> 
              <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
              <button class="btn" onclick="window.location.href='/'">Volver</button>
          </div>
      </body>
      </html>
      `;
      return res.send(html); 
  }

  };
// Ruta para la página principal
app.get('/', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Servir archivos estáticos (HTML)
app.use(express.static(path.join(__dirname, 'public')));
// Ruta para obtener el tipo de usuario actual
app.get('/tipo-usuario', requireLogin, (req, res) => {
  res.json({ tipo_usuario: req.session.user.tipo_usuario });
});
// Nueva ruta ESSENCIAL para el navbar dinámico (agrega esto)
app.get('/api/user-info', requireLogin, (req, res) => {
    res.json({
      role: req.session.user.tipo_usuario, 
      name: req.session.user.nombre_usuario
    });
  });
// Ruta para registrar
app.get('/registrar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registrar.html'));
});
// Registro de usuario
app.post('/registrar', (req, res) => {
    const { nombre_usuario, password, codigo_acceso } = req.body;
    console.log('Código de acceso recibido:', codigo_acceso); // Para depuración
    const query = 'SELECT tipo_usuario FROM codigos_acceso WHERE codigo = ?';
    
    connection.query(query, [codigo_acceso], (err, results) => {
        if (err) {
            let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    /* Reset de estilos */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
        
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        background-color: #f9f9f9; /* Color de fondo suave */
                        color: #333;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
        
                    .container {
                        width: 80%;
                        max-width: 400px;
                        margin: auto;
                        padding: 20px;
                        background: #ffffff; /* Fondo blanco para el contenedor */
                        border-radius: 10px; /* Bordes redondeados */
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
        
                    h1 {
                        color: #e74c3c; /* Color rojo para el título */
                        margin-bottom: 10px;
                    }
        
                    p {
                        margin: 15px 0;
                        font-size: 1.2em;
                        color: #e74c3c; /* Color rojo para el texto */
                    }
        
                    .btn {
                        padding: 10px 20px;
                        background: #35424a; /* Fondo del botón */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        text-decoration: none; /* Eliminar subrayado */
                        font-size: 1em; /* Tamaño de fuente del botón */
                    }
        
                    .btn:hover {
                        background: #506471; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Error al verificar el código de acceso</h1> 
                    <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
                    <button class="btn" onclick="window.location.href='/login'">Volver</button>
                </div>
            </body>
            </html>
            `;
            return res.send(html); 
        }
        
        // Verifica si se encontraron resultados
        if (results.length === 0) {
            let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
                <style>
                    /* Reset de estilos */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
        
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        background-color: #f9f9f9; /* Color de fondo suave */
                        color: #333;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
        
                    .container {
                        width: 80%;
                        max-width: 400px;
                        margin: auto;
                        padding: 20px;
                        background: #ffffff; /* Fondo blanco para el contenedor */
                        border-radius: 10px; /* Bordes redondeados */
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
        
                    h1 {
                        color: #e74c3c; /* Color rojo para el título */
                        margin-bottom: 10px;
                    }
        
                    p {
                        margin: 15px 0;
                        font-size: 1.2em;
                        color: #e74c3c; /* Color rojo para el texto */
                    }
        
                    .btn {
                        padding: 10px 20px;
                        background: #35424a; /* Fondo del botón */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        text-decoration: none; /* Eliminar subrayado */
                        font-size: 1em; /* Tamaño de fuente del botón */
                    }
        
                    .btn:hover {
                        background: #506471; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Código de acceso inválido</h1> 
                    <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
                    <button class="btn" onclick="window.location.href='/login'">Volver</button>
                </div>
            </body>
            </html>
            `;
            return res.send(html); 
        }

        const tipo_usuario = results[0].tipo_usuario; // Aquí es seguro acceder a results[0]
        const passwordhash = bcrypt.hashSync(password, 10);
        
        const insertUser   = 'INSERT INTO usuarios (nombre_usuario, password_hash, tipo_usuario) VALUES (?, ?, ?)';
        connection.query(insertUser  , [nombre_usuario, passwordhash, tipo_usuario], (err) => {
            if (err) {
                let html = `
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Error</title>
                    <style>
                        /* Reset de estilos */
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
        
                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            background-color: #f9f9f9; /* Color de fondo suave */
                            color: #333;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                        }
        
                        .container {
                            width: 80%;
                            max-width: 400px;
                            margin: auto;
                            padding: 20px;
                            background: #ffffff; /* Fondo blanco para el contenedor */
                            border-radius: 10px; /* Bordes redondeados */
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                            text-align: center;
                        }
        
                        h1 {
                            color: #e74c3c; /* Color rojo para el título */
                            margin-bottom: 10px;
                        }
        
                        p {
                            margin: 15px 0;
                            font-size: 1.2em;
                            color: #e74c3c; /* Color rojo para el texto */
                        }
        
                        .btn {
                            padding: 10px 20px;
                            background: #35424a; /* Fondo del botón */
                            color: #ffffff; /* Color del texto */
                            border: none; /* Sin borde */
                            border-radius: 5px; /* Bordes redondeados */
                            cursor: pointer; /* Cambia el cursor al pasar el mouse */
                            transition: background 0.3s; /* Transición suave para el fondo */
                            text-decoration: none; /* Eliminar subrayado */
                            font-size: 1em; /* Tamaño de fuente del botón */
                        }
        
                        .btn:hover {
                            background: #506471; /* Color de fondo al pasar el mouse */
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Error al registrar usuario</h1> 
                        <p>Ocurrió un problema al intentar registrar al usuario. Por favor, intenta nuevamente.</p>
                        <button class="btn" onclick="window.location.href='/login'">Volver</button>
                    </div>
                </body>
                </html>
                `;
                return res.send(html); 
            }
            
            // Mensaje de éxito al registrar el usuario
            let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Registro Exitoso</title>
                <style>
                    /* Reset de estilos */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
        
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        background-color: #f9f9f9; /* Color de fondo suave */
                        color: #333;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
        
                    .container {
                        width: 80%;
                        max-width: 400px;
                        margin: auto;
                        padding: 20px;
                        background: #ffffff; /* Fondo blanco para el contenedor */
                        border-radius: 10px; /* Bordes redondeados */
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
        
                    h1 {
                        color: #4caf50; /* Color verde para el título */
                        margin-bottom: 10px;
                    }
        
                    p {
                        margin: 15px 0;
                        font-size: 1.2em;
                        color: #4caf50; /* Color verde para el texto */
                    }
        
                    .btn {
                        padding: 10px 20px;
                        background: #35424a; /* Fondo del botón */
                        color: #ffffff; /* Color del texto */
                        border: none; /* Sin borde */
                        border-radius: 5px; /* Bordes redondeados */
                        cursor: pointer; /* Cambia el cursor al pasar el mouse */
                        transition: background 0.3s; /* Transición suave para el fondo */
                        text-decoration: none; /* Eliminar subrayado */
                        font-size: 1em; /* Tamaño de fuente del botón */
                    }
        
                    .btn:hover {
                        background: #506471; /* Color de fondo al pasar el mouse */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Registro Exitoso</h1> 
                    <p>El usuario ha sido registrado correctamente.</p>
                    <button class="btn" onclick="window.location.href='/login'">Iniciar Sesión</button>
                </div>
            </body>
            </html>
            `;
            return res.send(html); 
        });
    });
});
// Ruta para iniciar sesion
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
// Iniciar sesión
app.post('/login', (req, res) => {
  const { nombre_usuario, password } = req.body;
// Consulta para obtener el usuario y su tipo
    const query = 'SELECT * FROM usuarios WHERE nombre_usuario = ?';
    connection.query(query, [nombre_usuario], (err, results) => {
      if (err) {
        let html = `
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
                /* Reset de estilos */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
    
                body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    background-color: #f4f4f4;
                    color: #333;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
    
                .container {
                    width: 80%;
                    max-width: 400px;
                    margin: auto;
                    padding: 20px;
                    background: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
    
                h1 {
                    color: #e74c3c; /* Color rojo para el título */
                    margin-bottom: 10px;
                }
    
                p {
                    margin: 15px 0;
                    font-size: 1.2em;
                }
    
                .btn {
                    padding: 10px 20px;
                    background: #35424a; /* Fondo del botón */
                    color: #ffffff; /* Color del texto */
                    border: none; /* Sin borde */
                    border-radius: 5px; /* Bordes redondeados */
                    cursor: pointer; /* Cambia el cursor al pasar el mouse */
                    transition: background 0.3s; /* Transición suave para el fondo */
                    text-decoration: none; /* Eliminar subrayado */
                }
    
                .btn:hover {
                    background: #506471; /* Color de fondo al pasar el mouse */
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Error al obtener usuario</h1> 
                <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
                <button class="btn" onclick="window.location.href='/login'">Volver</button>
            </div>
        </body>
        </html>
        `;
        return res.send(html); 
      }
      if (results.length === 0) {
        let html = `
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
            <style>
                /* Reset de estilos */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
    
                body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    background-color: #f4f4f4;
                    color: #333;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
    
                .container {
                    width: 80%;
                    max-width: 400px;
                    margin: auto;
                    padding: 20px;
                    background: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
    
                h1 {
                    color: #e74c3c; /* Color rojo para el título */
                    margin-bottom: 10px;
                }
    
                p {
                    margin: 15px 0;
                    font-size: 1.2em;
                }
    
                .btn {
                    padding: 10px 20px;
                    background: #35424a; /* Fondo del botón */
                    color: #ffffff; /* Color del texto */
                    border: none; /* Sin borde */
                    border-radius: 5px; /* Bordes redondeados */
                    cursor: pointer; /* Cambia el cursor al pasar el mouse */
                    transition: background 0.3s; /* Transición suave para el fondo */
                    text-decoration: none; /* Eliminar subrayado */
                }
    
                .btn:hover {
                    background: #506471; /* Color de fondo al pasar el mouse */
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Usuario no encontrado</h1> 
                <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
                <button class="btn" onclick="window.location.href='/login'">Volver</button>
            </div>
        </body>
        </html>
        `;
        return res.send(html); 
      }
        const user = results[0];

        // Verificar la contraseña
        const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
        if (!isPasswordValid) {
          let html = `
          <html>
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Error</title>
              <style>
                  /* Reset de estilos */
                  * {
                      margin: 0;
                      padding: 0;
                      box-sizing: border-box;
                  }
      
                  body {
                      font-family: 'Arial', sans-serif;
                      line-height: 1.6;
                      background-color: #f4f4f4;
                      color: #333;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      height: 100vh;
                  }
      
                  .container {
                      width: 80%;
                      max-width: 400px;
                      margin: auto;
                      padding: 20px;
                      background: #ffffff;
                      border-radius: 5px;
                      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                      text-align: center;
                  }
      
                  h1 {
                      color: #e74c3c; /* Color rojo para el título */
                      margin-bottom: 10px;
                  }
      
                  p {
                      margin: 15px 0;
                      font-size: 1.2em;
                  }
      
                  .btn {
                      padding: 10px 20px;
                      background: #35424a; /* Fondo del botón */
                      color: #ffffff; /* Color del texto */
                      border: none; /* Sin borde */
                      border-radius: 5px; /* Bordes redondeados */
                      cursor: pointer; /* Cambia el cursor al pasar el mouse */
                      transition: background 0.3s; /* Transición suave para el fondo */
                      text-decoration: none; /* Eliminar subrayado */
                  }
      
                  .btn:hover {
                      background: #506471; /* Color de fondo al pasar el mouse */
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <h1>Contraseña incorrecta</h1> 
                  <p>Ocurrió un problema al intentar acceder a la información del usuario. Por favor, intenta nuevamente.</p>
                  <button class="btn" onclick="window.location.href='/login'">Volver</button>
              </div>
          </body>
          </html>
          `;
          return res.send(html); 
        }
        // Almacenar la información del usuario en la sesión
        req.session.user = {
            id: user.id,
            nombre_usuario: user.nombre_usuario,
            tipo_usuario: user.tipo_usuario // Aquí se establece el tipo de usuario en la sesión
        };

        // Redirigir al usuario a la página principal
        res.redirect('/');
    });
});
// Cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});
app.get('/agregar-equipo', requireLogin, requireRole('admin'), async (req, res) => {
    try {
        // Obtener pisos desde la base de datos
        const [pisos] = await connection.promise().query('SELECT id, numero_piso, nombre_piso FROM pisos_hospital ORDER BY numero_piso');
        
        let html = `
        <html>
        <head>
            <title>Agregar Equipo Médico</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                form { max-width: 600px; margin: 0 auto; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input, select { 
                    width: 100%; 
                    padding: 8px; 
                    border: 1px solid #ddd; 
                    border-radius: 4px;
                    box-sizing: border-box;
                }
                button { 
                    background-color: #4CAF50; 
                    color: white; 
                    padding: 10px 15px; 
                    border: none; 
                    border-radius: 4px; 
                    cursor: pointer;
                    margin-top: 10px;
                }
                button:hover { background-color: #45a049; }
                #ubicacion { background-color: #f5f5f5; }
            </style>
            <script>
                function actualizarUbicacion() {
                    const selectPiso = document.getElementById('piso_id');
                    const ubicacion = document.getElementById('ubicacion');
                    const pisoSeleccionado = selectPiso.options[selectPiso.selectedIndex];
                    ubicacion.value = pisoSeleccionado.text;
                }
            </script>
        </head>
        <body>
            <h1>Agregar Equipo Médico</h1>
            <form action="/guardar-equipo" method="POST">
                <div class="form-group">
                    <label>Nombre del Equipo:</label>
                    <input type="text" name="nombre_equipo" required>
                </div>

                <div class="form-group">
                    <label>Modelo:</label>
                    <input type="text" name="modelo">
                </div>

                <div class="form-group">
                    <label>Fabricante:</label>
                    <input type="text" name="fabricante">
                </div>

                <div class="form-group">
                    <label>Fecha de Adquisición:</label>
                    <input type="date" name="fecha_adquisicion" required>
                </div>

                <div class="form-group">
                    <label>Estado:</label>
                    <select name="estado" required>
                        <option value="activo">Activo</option>
                        <option value="en reparación">En reparación</option>
                        <option value="fuera de servicio">Fuera de servicio</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Piso:</label>
                    <select id="piso_id" name="piso_id" required onchange="actualizarUbicacion()">
                        <option value="">Seleccione un piso...</option>
                        ${pisos.map(piso => `
                            <option value="${piso.id}">Piso ${piso.numero_piso} - ${piso.nombre_piso}</option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Ubicación:</label>
                    <input type="text" id="ubicacion" name="ubicacion" readonly>
                </div>

                <div class="form-group">
                    <label>Responsable:</label>
                    <input type="text" name="responsable">
                </div>

                <button type="submit">Guardar Equipo</button>
                <button type="button" onclick="window.location.href='/equipos'">Cancelar</button>
            </form>
        </body>
        </html>
        `;
        res.send(html);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('<h1>Error al cargar el formulario</h1>');
    }
});
app.post('/guardar-equipo', requireLogin, requireRole('admin'), async (req, res) => {
    try {
        const { nombre_equipo, modelo, fabricante, fecha_adquisicion, estado, piso_id, ubicacion, responsable } = req.body;
        
        // Verificar que el piso existe
        const [piso] = await connection.promise().query('SELECT id FROM pisos_hospital WHERE id = ?', [piso_id]);
        if (piso.length === 0) {
            throw new Error('El piso seleccionado no existe');
        }

        // Insertar en la base de datos
        await connection.promise().query(
            `INSERT INTO equipos_medicos 
             (nombre_equipo, modelo, fabricante, fecha_adquisicion, estado, piso_id, ubicacion, responsable)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre_equipo, modelo, fabricante, fecha_adquisicion, estado, piso_id, ubicacion, responsable]
        );

        res.send(`
            <html>
            <head>
                <title>Éxito</title>
                <style>
                    .success { 
                        background-color: #dff0d8; 
                        color: #3c763d; 
                        padding: 15px; 
                        margin: 20px; 
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="success">
                    <h1>Equipo guardado exitosamente</h1>
                    <p>El equipo médico ha sido registrado correctamente.</p>
                </div>
                <button onclick="window.location.href='/equipos'">Ver todos los equipos</button>
                <button onclick="window.location.href='/agregar-equipo'">Agregar otro equipo</button>
            </body>
            </html>
        `);
    } catch (err) {
        console.error('Error al guardar equipo:', err);
        res.status(500).send(`
            <html>
            <head>
                <title>Error</title>
                <style>
                    .error { 
                        background-color: #f2dede; 
                        color: #a94442; 
                        padding: 15px; 
                        margin: 20px; 
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="error">
                    <h1>Error al guardar el equipo</h1>
                    <p>${err.message}</p>
                </div>
                <button onclick="window.location.href='/agregar-equipo'">Volver al formulario</button>
            </body>
            </html>
        `);
    }
});
app.get('/equipos', requireLogin, requireRole(['admin', 'medico']), async (req, res) => {
    try {
        const { piso } = req.query;
        
        // Consulta base
        let query = `
            SELECT e.*, p.numero_piso, p.nombre_piso as nombre_piso_completo
            FROM equipos_medicos e
            LEFT JOIN pisos_hospital p ON e.piso_id = p.id
        `;
        
        // Añadir filtro si existe
        if (piso) {
            query += ' WHERE e.piso_id = ?';
        }
        
        query += ' ORDER BY e.id DESC';
        
        // Ejecutar consulta
        const [equipos] = piso 
            ? await connection.promise().query(query, [piso])
            : await connection.promise().query(query);
        
        // Obtener info del piso si hay filtro
        let pisoInfo = null;
        if (piso) {
            const [pisoData] = await connection.promise().query(
                'SELECT * FROM pisos_hospital WHERE id = ?', 
                [piso]
            );
            pisoInfo = pisoData[0];
        }

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Equipos Médicos ${pisoInfo ? `| Piso ${pisoInfo.numero_piso}` : ''}</title>
            <link rel="stylesheet" href="/styles.css">
            <style>
                :root {
                    --primary: #2c3e50;
                    --secondary: #3498db;
                    --success: #27ae60;
                    --warning: #f39c12;
                    --danger: #e74c3c;
                    --light: #ecf0f1;
                    --dark: #2c3e50;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    background-color: #f5f7fa;
                    color: #333;
                    padding: 20px;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                
                h1 {
                    color: var(--primary);
                    margin: 0;
                }
                
                .piso-info {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 30px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    border-left: 4px solid var(--secondary);
                }
                
                .piso-title {
                    color: var(--primary);
                    margin-top: 0;
                }
                
                .equipos-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }
                
                .equipo-card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 20px;
                    transition: transform 0.3s ease;
                    border-top: 4px solid var(--secondary);
                }
                
                .equipo-card:hover {
                    transform: translateY(-5px);
                }
                
                .equipo-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }
                
                .equipo-title {
                    font-size: 1.2rem;
                    color: var(--primary);
                    margin: 0;
                    word-break: break-word;
                }
                
                .equipo-id {
                    background: var(--light);
                    color: var(--dark);
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                }
                
                .equipo-details {
                    margin: 15px 0;
                }
                
                .detail-row {
                    display: flex;
                    margin-bottom: 8px;
                }
                
                .detail-label {
                    font-weight: bold;
                    width: 100px;
                    color: #7f8c8d;
                    flex-shrink: 0;
                }
                
                .detail-value {
                    color: #333;
                }
                
                .status {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 0.9rem;
                }
                
                .status-activo {
                    background-color: #d4edda;
                    color: #155724;
                }
                
                .status-reparacion {
                    background-color: #fff3cd;
                    color: #856404;
                }
                
                .status-inactivo {
                    background-color: #f8d7da;
                    color: #721c24;
                }
                
                .actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    text-decoration: none;
                    font-size: 0.9rem;
                    transition: all 0.3s;
                }
                
                .btn-primary {
                    background-color: var(--secondary);
                    color: white;
                }
                
                .btn-primary:hover {
                    background-color: #2563eb;
                }
                
                .btn-secondary {
                    background-color: var(--light);
                    color: var(--dark);
                }
                
                .btn-secondary:hover {
                    background-color: #bdc3c7;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                @media (max-width: 768px) {
                    .equipos-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
            </style>
        </head>
        <body>
            <div id="navbar"></div>
            
            <main class="container">
                <div class="header">
                    <h1>Equipos Médicos ${pisoInfo ? `- Piso ${pisoInfo.numero_piso}` : ''}</h1>
                    <div>
                        ${pisoInfo ? `
                            <button class="btn btn-secondary" onclick="window.location.href='/equipos'">
                                Ver Todos los Equipos
                            </button>
                        ` : ''}
                        <button class="btn btn-primary" onclick="window.location.href='/pisos'">
                            Ver Todos los Pisos
                        </button>
                    </div>
                </div>
                
                ${pisoInfo ? `
                <div class="piso-info">
                    <h2 class="piso-title">${pisoInfo.nombre_piso}</h2>
                    <p>${pisoInfo.descripcion}</p>
                    <div class="detail-row">
                        <span class="detail-label">Responsable:</span>
                        <span class="detail-value">${pisoInfo.responsable_piso}</span>
                    </div>
                </div>
                ` : ''}
                
                ${equipos.length > 0 ? `
                <div class="equipos-grid">
                    ${equipos.map(equipo => `
                    <div class="equipo-card">
                        <div class="equipo-header">
                            <h3 class="equipo-title">${equipo.nombre_equipo}</h3>
                            <span class="equipo-id">ID: ${equipo.id}</span>
                        </div>
                        
                        <div class="equipo-details">
                            <div class="detail-row">
                                <span class="detail-label">Modelo:</span>
                                <span class="detail-value">${equipo.modelo || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Fabricante:</span>
                                <span class="detail-value">${equipo.fabricante || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Fecha Adq.:</span>
                                <span class="detail-value">${equipo.fecha_adquisicion}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Estado:</span>
                                <span class="status status-${equipo.estado.split(' ')[0].toLowerCase()}">
                                    ${equipo.estado}
                                </span>
                            </div>
                            ${!pisoInfo ? `
                            <div class="detail-row">
                                <span class="detail-label">Piso:</span>
                                <span class="detail-value">Piso ${equipo.numero_piso} - ${equipo.nombre_piso_completo}</span>
                            </div>
                            ` : ''}
                            <div class="detail-row">
                                <span class="detail-label">Ubicación:</span>
                                <span class="detail-value">${equipo.ubicacion || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Responsable:</span>
                                <span class="detail-value">${equipo.responsable || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : `
                <div class="empty-state">
                    <h3>No se encontraron equipos</h3>
                    <p>${pisoInfo ? `No hay equipos registrados en este piso` : `No hay equipos médicos registrados`}</p>
                </div>
                `}
                
                <div class="actions" style="margin-top: 30px;">
                    <button class="btn btn-primary" onclick="window.location.href='/agregar-equipo'">
                        Agregar Nuevo Equipo
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.href='/'">
                        Volver al Menú
                    </button>
                </div>
            </main>
            
            <script>
                // Cargar navbar
                fetch('/navbar.html')
                    .then(response => response.text())
                    .then(data => {
                        document.getElementById('navbar').innerHTML = data;
                    })
                    .catch(error => console.error('Error cargando navbar:', error));
            </script>
        </body>
        </html>
        `;
        
        res.send(html);
    } catch (err) {
        console.error('Error al obtener equipos:', err);
        res.status(500).send(`
            <html>
            <head>
                <title>Error</title>
                <style>
                    .error-container {
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 30px;
                        background: #f8d7da;
                        color: #721c24;
                        border-radius: 8px;
                        text-align: center;
                    }
                    .error-title {
                        margin-top: 0;
                    }
                    .error-btn {
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h2 class="error-title">Error al cargar los equipos</h2>
                    <p>Por favor, intente nuevamente más tarde.</p>
                    <button class="btn btn-primary error-btn" onclick="window.location.href='/equipos'">
                        Reintentar
                    </button>
                </div>
            </body>
            </html>
        `);
    }
});
app.get('/pisos', requireLogin, requireRole(['admin', 'medico']), async (req, res) => {
    try {
        // Obtener todos los pisos usando connection.promise()
        const [pisos] = await connection.promise().query('SELECT * FROM pisos_hospital ORDER BY numero_piso');
        
        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pisos del Hospital | VitalInvent</title>
            <link rel="stylesheet" href="/styles.css">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2c3e50; }
                .piso-container { 
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .piso-card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 20px;
                    border-left: 4px solid #3498db;
                }
                .piso-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .piso-title {
                    font-size: 1.2rem;
                    color: #2c3e50;
                    margin: 0;
                }
                .piso-number {
                    background: #2563eb;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }
                .piso-desc {
                    color: #7f8c8d;
                    margin-bottom: 10px;
                }
                .piso-responsable {
                    font-style: italic;
                    color: #3498db;
                }
                .actions {
                    margin-top: 15px;
                    display: flex;
                    gap: 10px;
                }
                .btn {
                    padding: 8px 12px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    text-decoration: none;
                    font-size: 0.9rem;
                }
                .btn-primary {
                    background-color: #2563eb;
                    color: white;
                }
                .btn-secondary {
                    background-color: #95a5a6;
                    color: white;
                }
                .btn:hover {
                    opacity: 0.9;
                }
            </style>
        </head>
        <body>
            <h1>Pisos del Hospital VITALINVENT</h1>
            
            <div class="piso-container">
                ${pisos.map(piso => `
                <div class="piso-card">
                    <div class="piso-header">
                        <h3 class="piso-title">${piso.nombre_piso}</h3>
                        <div class="piso-number">${piso.numero_piso}</div>
                    </div>
                    <p class="piso-desc">${piso.descripcion}</p>
                    <p class="piso-responsable">Responsable: ${piso.responsable_piso}</p>
                    <div class="actions">
                        <a href="/equipos?piso=${piso.id}" class="btn btn-primary">
                            Ver Equipos
                        </a>
                        ${req.session.user.tipo_usuario === 'admin' ? `
                        <a href="/editar-piso?id=${piso.id}" class="btn btn-secondary">
                            Editar
                        </a>
                        ` : ''}
                    </div>
                </div>
                `).join('')}
            </div>
            
            ${req.session.user.tipo_usuario === 'admin' ? `
            <div style="margin-top: 30px;">
                <a href="/agregar-piso" class="btn btn-primary">
                    + Agregar Nuevo Piso
                </a>
            </div>
            ` : ''}
        </body>
        </html>
        `;
        
        res.send(html);
    } catch (err) {
        console.error('Error al obtener los pisos:', err);
        res.status(500).send(`
            <html>
            <head>
                <title>Error</title>
                <style>
                    .error-message {
                        background: #f8d7da;
                        color: #721c24;
                        padding: 20px;
                        border-radius: 5px;
                        max-width: 600px;
                        margin: 30px auto;
                    }
                </style>
            </head>
            <body>
                <div class="error-message">
                    <h2>Error al cargar los pisos</h2>
                    <p>Por favor intente nuevamente más tarde.</p>
                    <button onclick="window.location.href='/'" style="margin-top: 15px;">
                        Volver al inicio
                    </button>
                </div>
            </body>
            </html>
        `);
    }
});
app.get('/reportar-anomalia', requireLogin, requireRole(['admin', 'medico']), async (req, res) => {
    try {
        const [equipos] = await connection.promise().query(`
            SELECT id, nombre_equipo, ubicacion 
            FROM equipos_medicos 
            WHERE estado = 'activo'
            ORDER BY nombre_equipo
        `);

        res.send(`
        <html>
        <head>
            <title>Reportar Anomalía</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .form-container { background: white; max-width: 600px; margin: 20px auto; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                textarea { min-height: 100px; }
                .btn { background: #3498db; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
            </style>
        </head>
        <body>
            <div id="navbar"></div>
            <div class="form-container">
                <h1>Reportar Anomalía</h1>
                <form action="/registrar-anomalia" method="POST">
                    <div class="form-group">
                        <label>Equipo Médico:</label>
                        <select name="equipo_id" required>
                            <option value="">Seleccione un equipo</option>
                            ${equipos.map(equipo => `
                                <option value="${equipo.id}">${equipo.nombre_equipo} (${equipo.ubicacion})</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción:</label>
                        <textarea name="descripcion" required placeholder="Describa el problema..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Gravedad:</label>
                        <select name="gravedad" required>
                            <option value="leve">Leve (puede usarse con precaución)</option>
                            <option value="grave">Grave (no usar)</option>
                        </select>
                    </div>
                    <button type="submit" class="btn">Reportar</button>
                </form>
            </div>
            <script>
                fetch('/navbar.html').then(r => r.text()).then(d => document.getElementById('navbar').innerHTML = d);
            </script>
        </body>
        </html>
        `);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error al cargar el formulario');
    }
});
app.post('/registrar-anomalia', requireLogin, requireRole(['admin', 'medico']), async (req, res) => {
    try {
        const { equipo_id, descripcion, gravedad } = req.body;
        const usuario_id = req.session.user.id;

        await connection.promise().query('START TRANSACTION');

        // Registrar en reportes_mantenimiento
        await connection.promise().query(`
            INSERT INTO reportes_mantenimiento 
            (equipo_id, usuario_id, descripcion, gravedad, fecha_reporte) 
            VALUES (?, ?, ?, ?, NOW())
        `, [equipo_id, usuario_id, descripcion, gravedad]);

        // Actualizar estado del equipo
        const nuevoEstado = gravedad === 'grave' ? 'fuera de servicio' : 'en reparación';
        await connection.promise().query(`
            UPDATE equipos_medicos SET estado = ? WHERE id = ?
        `, [nuevoEstado, equipo_id]);

        await connection.promise().query('COMMIT');

        // Respuesta exitosa
        res.send(`
        <html>
        <head>
            <style>
                .success-box { background: #d4edda; color: #155724; padding: 20px; max-width: 600px; margin: 50px auto; text-align: center; border-radius: 5px; }
                .btn { background: #3498db; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div id="navbar"></div>
            <div class="success-box">
                <h2>✅ Reporte registrado</h2>
                <p>El equipo está ahora <strong>${nuevoEstado}</strong></p>
                <a href="/" class="btn">Volver al inicio</a>
            </div>
            <script>
                fetch('/navbar.html').then(r => r.text()).then(d => document.getElementById('navbar').innerHTML = d);
            </script>
        </body>
        </html>
        `);
    } catch (err) {
        await connection.promise().query('ROLLBACK');
        console.error('Error:', err);
        res.status(500).send('Error al registrar el reporte');
    }
});
app.get('/mantenimiento', requireLogin, requireRole(['admin', 'tecnico']), async (req, res) => {
    try {
        const [equipos] = await connection.promise().query(`
            SELECT e.id, e.nombre_equipo, e.ubicacion, e.estado, 
                   p.nombre_piso, r.descripcion, r.gravedad, r.fecha_reporte
            FROM equipos_medicos e
            JOIN pisos_hospital p ON e.piso_id = p.id
            LEFT JOIN reportes_mantenimiento r ON e.id = r.equipo_id AND r.fecha_solucion IS NULL
            WHERE e.estado IN ('en reparación', 'fuera de servicio')
            ORDER BY e.estado, r.fecha_reporte
        `);

        res.send(`
        <html>
        <head>
            <title>Mantenimiento</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 1200px; margin: 0 auto; }
                .equipo-card { background: white; border-left: 4px solid; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
                .fuera-de-servicio { border-color: #e74c3c; }
                .en-reparacion { border-color: #f39c12; }
                .btn { background: #3498db; color: white; padding: 8px 12px; text-decoration: none; border-radius: 4px; display: inline-block; }
            </style>
        </head>
        <body>
            <div id="navbar"></div>
            <div class="container">
                <h1>Equipos en Mantenimiento</h1>
                ${equipos.map(equipo => `
                <div class="equipo-card ${equipo.estado === 'fuera de servicio' ? 'fuera-de-servicio' : 'en-reparacion'}">
                    <h3>${equipo.nombre_equipo}</h3>
                    <p><strong>Estado:</strong> ${equipo.estado}</p>
                    <p><strong>Ubicación:</strong> ${equipo.ubicacion} (Piso ${equipo.nombre_piso})</p>
                    <p><strong>Problema:</strong> ${equipo.descripcion || 'No especificado'}</p>
                    <a href="/registrar-mantenimiento?equipo_id=${equipo.id}" class="btn">Reparar</a>
                </div>
                `).join('')}
            </div>
            <script>
                fetch('/navbar.html').then(r => r.text()).then(d => document.getElementById('navbar').innerHTML = d);
            </script>
        </body>
        </html>
        `);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error al cargar equipos');
    }
});
app.get('/registrar-mantenimiento', requireLogin, requireRole(['admin', 'tecnico']), async (req, res) => {
    try {
        const { equipo_id } = req.query;
        const [equipos] = await connection.promise().query(`
            SELECT e.*, p.nombre_piso, r.descripcion
            FROM equipos_medicos e
            JOIN pisos_hospital p ON e.piso_id = p.id
            LEFT JOIN reportes_mantenimiento r ON e.id = r.equipo_id AND r.fecha_solucion IS NULL
            WHERE e.id = ?
        `, [equipo_id]);

        if (equipos.length === 0) return res.status(404).send('Equipo no encontrado');

        const equipo = equipos[0];
        res.send(`
        <html>
        <head>
            <title>Registrar Mantenimiento</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .form-container { background: white; max-width: 600px; margin: 20px auto; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                textarea { min-height: 100px; }
                .btn { background: #3498db; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
            </style>
        </head>
        <body>
            <div id="navbar"></div>
            <div class="form-container">
                <h1>Registrar Mantenimiento</h1>
                <form action="/finalizar-mantenimiento" method="POST">
                    <input type="hidden" name="equipo_id" value="${equipo.id}">
                    <div class="form-group">
                        <label>Acciones realizadas:</label>
                        <textarea name="acciones" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Repuestos utilizados:</label>
                        <input type="text" name="repuestos">
                    </div>
                    <div class="form-group">
                        <label>Tiempo invertido (horas):</label>
                        <input type="number" name="tiempo" step="0.5" min="0.5" required>
                    </div>
                    <div class="form-group">
                        <label>Estado final:</label>
                        <select name="estado_final" required>
                            <option value="activo">Reparado (Activo)</option>
                            <option value="fuera de servicio">Requiere más trabajo</option>
                        </select>
                    </div>
                    <button type="submit" class="btn">Finalizar</button>
                </form>
            </div>
            <script>
                fetch('/navbar.html').then(r => r.text()).then(d => document.getElementById('navbar').innerHTML = d);
            </script>
        </body>
        </html>
        `);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error al cargar el formulario');
    }
});
app.post('/finalizar-mantenimiento', requireLogin, requireRole(['admin', 'tecnico']), async (req, res) => {
    try {
        const { equipo_id, acciones, repuestos, tiempo, estado_final } = req.body;
        const tecnico_id = req.session.user.id;

        await connection.promise().query('START TRANSACTION');

        // Actualizar reporte
        await connection.promise().query(`
            UPDATE reportes_mantenimiento 
            SET 
                fecha_solucion = NOW(),
                acciones_realizadas = ?,
                repuestos_utilizados = ?,
                tiempo_invertido = ?,
                tecnico_id = ?
            WHERE equipo_id = ? AND fecha_solucion IS NULL
        `, [acciones, repuestos, tiempo, tecnico_id, equipo_id]);

        // Actualizar estado del equipo
        await connection.promise().query(`
            UPDATE equipos_medicos SET estado = ? WHERE id = ?
        `, [estado_final, equipo_id]);

        await connection.promise().query('COMMIT');

        // Respuesta exitosa
        res.send(`
        <html>
        <head>
            <style>
                .success-box { background: #d4edda; color: #155724; padding: 20px; max-width: 600px; margin: 50px auto; text-align: center; border-radius: 5px; }
                .btn { background: #3498db; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div id="navbar"></div>
            <div class="success-box">
                <h2>🔧 Mantenimiento registrado</h2>
                <p>El equipo ahora está <strong>${estado_final}</strong></p>
                <a href="/mantenimiento" class="btn">Volver a mantenimiento</a>
            </div>
            <script>
                fetch('/navbar.html').then(r => r.text()).then(d => document.getElementById('navbar').innerHTML = d);
            </script>
        </body>
        </html>
        `);
    } catch (err) {
        await connection.promise().query('ROLLBACK');
        console.error('Error:', err);
        res.status(500).send('Error al registrar el mantenimiento');
    }
}); 
//Historial de Mantenimientos (Técnicos/Admin)
app.get('/historico-mantenimiento', requireLogin, requireRole(['admin', 'tecnico']), async (req, res) => {
    try {
        const [reportes] = await connection.promise().query(`
            SELECT 
                r.id, 
                e.nombre_equipo,
                e.ubicacion,
                u1.nombre as reportado_por,
                u2.nombre as reparado_por,
                r.descripcion,
                r.gravedad,
                r.fecha_reporte,
                r.fecha_solucion,
                r.acciones_realizadas,
                r.tiempo_invertido
            FROM reportes_mantenimiento r
            JOIN equipos_medicos e ON r.equipo_id = e.id
            JOIN usuarios u1 ON r.usuario_id = u1.id
            LEFT JOIN usuarios u2 ON r.tecnico_id = u2.id
            WHERE r.fecha_solucion IS NOT NULL
            ORDER BY r.fecha_solucion DESC
        `);

        res.send(`
        <html>
        <head>
            <title>Historial de Mantenimientos</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                .container { max-width: 1200px; margin: 0 auto; }
                table { width: 100%; border-collapse: collapse; background: white; }
                th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #3498db; color: white; }
                tr:hover { background: #f1f1f1; }
                .badge { padding: 3px 8px; border-radius: 12px; font-size: 12px; }
                .badge-leve { background: #fff3e0; color: #e65100; }
                .badge-grave { background: #ffebee; color: #c62828; }
                .btn { background: #3498db; color: white; padding: 8px 12px; border-radius: 4px; text-decoration: none; }
            </style>
        </head>
        <body>
            <div id="navbar"></div>
            <div class="container">
                <h1>Historial de Mantenimientos</h1>
                
                <table>
                    <thead>
                        <tr>
                            <th>Equipo</th>
                            <th>Ubicación</th>
                            <th>Reportado por</th>
                            <th>Gravedad</th>
                            <th>Fecha Reporte</th>
                            <th>Fecha Solución</th>
                            <th>Técnico</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportes.map(reporte => `
                        <tr>
                            <td>${reporte.nombre_equipo}</td>
                            <td>${reporte.ubicacion}</td>
                            <td>${reporte.reportado_por}</td>
                            <td><span class="badge badge-${reporte.gravedad}">${reporte.gravedad}</span></td>
                            <td>${new Date(reporte.fecha_reporte).toLocaleString()}</td>
                            <td>${new Date(reporte.fecha_solucion).toLocaleString()}</td>
                            <td>${reporte.reparado_por || 'N/A'}</td>
                            <td><a href="/detalle-mantenimiento?id=${reporte.id}" class="btn">Ver Detalle</a></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <script>
                fetch('/navbar.html')
                    .then(response => response.text())
                    .then(data => {
                        document.getElementById('navbar').innerHTML = data;
                    });
            </script>
        </body>
        </html>
        `);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error al cargar el historial');
    }
});
// Ruta para mostrar equipos críticos (fuera de servicio)
app.get('/equipos-criticos', requireLogin, requireRole(['admin', 'medico', 'tecnico']), async (req, res) => {
    try {
        // Consulta para obtener equipos en estado crítico
        const [equipos] = await connection.promise().query(`
            SELECT 
                e.id,
                e.nombre_equipo,
                e.modelo,
                e.fabricante,
                e.ubicacion,
                e.estado,
                p.nombre_piso,
                p.numero_piso,
                r.descripcion,
                r.gravedad,
                r.fecha_reporte,
                u.nombre_usuario as reportado_por
            FROM equipos_medicos e
            JOIN pisos_hospital p ON e.piso_id = p.id
            LEFT JOIN reportes_mantenimiento r ON e.id = r.equipo_id AND r.fecha_solucion IS NULL
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            WHERE e.estado = 'fuera de servicio'
            ORDER BY r.fecha_reporte DESC
        `);

        // HTML de respuesta
        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Equipos Críticos | VitalInvent</title>
            <style>
                :root {
                    --primary: #2c3e50;
                    --danger: #e74c3c;
                    --warning: #f39c12;
                    --light: #ecf0f1;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f5f7fa;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                h1 {
                    color: var(--danger);
                    margin-bottom: 20px;
                    border-bottom: 2px solid var(--danger);
                    padding-bottom: 10px;
                }
                
                .equipo-card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 20px;
                    margin-bottom: 20px;
                    border-left: 4px solid var(--danger);
                }
                
                .equipo-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .equipo-title {
                    font-size: 1.3rem;
                    color: var(--primary);
                    margin: 0;
                }
                
                .equipo-status {
                    display: inline-block;
                    padding: 5px 10px;
                    background-color: var(--danger);
                    color: white;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 0.9rem;
                }
                
                .equipo-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 15px;
                    margin-top: 15px;
                }
                
                .detail-group {
                    margin-bottom: 10px;
                }
                
                .detail-label {
                    font-weight: bold;
                    color: #7f8c8d;
                    font-size: 0.9rem;
                }
                
                .detail-value {
                    color: #333;
                }
                
                .gravedad-leve {
                    color: var(--warning);
                    font-weight: bold;
                }
                
                .gravedad-grave {
                    color: var(--danger);
                    font-weight: bold;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .btn {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: var(--primary);
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 20px;
                }
                
                @media (max-width: 768px) {
                    .equipo-details {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div id="navbar"></div>
            
            <div class="container">
                <h1>Equipos Médicos Fuera de Servicio</h1>
                
                ${equipos.length > 0 ? `
                    ${equipos.map(equipo => `
                    <div class="equipo-card">
                        <div class="equipo-header">
                            <h3 class="equipo-title">${equipo.nombre_equipo}</h3>
                            <span class="equipo-status">${equipo.estado}</span>
                        </div>
                        
                        <div class="equipo-details">
                            <div class="detail-group">
                                <div class="detail-label">Modelo</div>
                                <div class="detail-value">${equipo.modelo || 'No especificado'}</div>
                            </div>
                            
                            <div class="detail-group">
                                <div class="detail-label">Fabricante</div>
                                <div class="detail-value">${equipo.fabricante || 'No especificado'}</div>
                            </div>
                            
                            <div class="detail-group">
                                <div class="detail-label">Ubicación</div>
                                <div class="detail-value">Piso ${equipo.numero_piso} - ${equipo.nombre_piso}<br>
                                ${equipo.ubicacion || 'Ubicación no especificada'}</div>
                            </div>
                            
                            <div class="detail-group">
                                <div class="detail-label">Reportado por</div>
                                <div class="detail-value">${equipo.reportado_por || 'No especificado'}</div>
                            </div>
                            
                            <div class="detail-group">
                                <div class="detail-label">Fecha de reporte</div>
                                <div class="detail-value">${new Date(equipo.fecha_reporte).toLocaleString() || 'No especificada'}</div>
                            </div>
                            
                            <div class="detail-group">
                                <div class="detail-label">Gravedad</div>
                                <div class="detail-value ${equipo.gravedad === 'grave' ? 'gravedad-grave' : 'gravedad-leve'}">
                                    ${equipo.gravedad === 'grave' ? 'Grave (No usar)' : 'Leve (Usar con precaución)'}
                                </div>
                            </div>
                            
                            <div class="detail-group" style="grid-column: 1 / -1;">
                                <div class="detail-label">Descripción del problema</div>
                                <div class="detail-value">${equipo.descripcion || 'No se proporcionó descripción'}</div>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                ` : `
                    <div class="empty-state">
                        <h3>No hay equipos fuera de servicio</h3>
                        <p>Actualmente todos los equipos médicos están operativos.</p>
                    </div>
                `}
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="/" class="btn">Volver al inicio</a>
                    ${req.session.user.tipo_usuario === 'tecnico' || req.session.user.tipo_usuario === 'admin' ? `
                    <a href="/mantenimiento" class="btn" style="background-color: var(--danger);">Ir a mantenimiento</a>
                    ` : ''}
                </div>
            </div>
            
            <script>
                // Cargar navbar dinámico
                fetch('/api/user-info')
                    .then(response => response.json())
                    .then(data => {
                        const navbarHtml = \`
                            <nav style="background: #2563eb; color: white; padding: 15px;">
                                <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
                                    <a href="/" style="color: white; text-decoration: none; font-weight: bold; font-size: 1.2rem;">VitalInvent</a>
                                    <div style="display: flex; align-items: center; gap: 20px;">
                                        <span>Bienvenido, \${data.name}</span>
                                        <a href="/logout" style="color: white; text-decoration: none;">Cerrar sesión</a>
                                    </div>
                                </div>
                            </nav>
                        \`;
                        document.getElementById('navbar').innerHTML = navbarHtml;
                    })
                    .catch(error => {
                        console.error('Error loading user info:', error);
                        document.getElementById('navbar').innerHTML = '<nav style="background: #2c3e50; padding: 15px;"><a href="/" style="color: white; text-decoration: none;">VitalInvent</a></nav>';
                    });
            </script>
        </body>
        </html>
        `);
    } catch (err) {
        console.error('Error al obtener equipos críticos:', err);
        res.status(500).send(`
            <html>
            <head>
                <title>Error</title>
                <style>
                    .error-container {
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 30px;
                        background: #ffebee;
                        color: #c62828;
                        border-radius: 8px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h2>Error al cargar equipos críticos</h2>
                    <p>Por favor, intente nuevamente más tarde.</p>
                    <a href="/" style="color: #1565c0;">Volver al inicio</a>
                </div>
            </body>
            </html>
        `);
    }
});
// Ruta API para estadísticas reales 
app.get('/api/estadisticas-reales', requireLogin, async (req, res) => {
    try {
        // Obtener equipos críticos
        const [equiposCriticos] = await connection.promise().query(`
            SELECT e.*, r.descripcion 
            FROM equipos_medicos e
            JOIN reportes_mantenimiento r ON e.id = r.equipo_id
            WHERE e.estado = 'fuera de servicio' AND r.fecha_solucion IS NULL
            LIMIT 3
        `);

        // Obtener estadísticas generales
        const [stats] = await connection.promise().query(`
            SELECT 
                (SELECT COUNT(*) FROM equipos_medicos) as totalEquipos,
                (SELECT COUNT(*) FROM equipos_medicos WHERE estado = 'activo') as equiposActivos,
                (SELECT COUNT(*) FROM equipos_medicos WHERE estado = 'en reparación') as equiposReparacion,
                (SELECT COUNT(*) FROM equipos_medicos WHERE estado = 'fuera de servicio') as equiposInactivos,
                (SELECT COUNT(*) FROM pisos_hospital) as totalPisos,
                (SELECT COUNT(*) FROM reportes_mantenimiento WHERE fecha_solucion IS NULL) as reportesPendientes
        `);

        res.json({
            userRole: req.session.user.tipo_usuario,
            equiposCriticos: equiposCriticos,
            totalEquipos: stats[0].totalEquipos,
            equiposActivos: stats[0].equiposActivos,
            equiposReparacion: stats[0].equiposReparacion,
            equiposInactivos: stats[0].equiposInactivos,
            totalPisos: stats[0].totalPisos,
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error al cargar datos' });
    }
});
// Ruta para mostrar todos los usuarios
app.get('/usuarios', requireLogin, requireRole(['admin']), async (req, res) => {
    try {
        // Consulta para obtener usuarios (solo los campos necesarios)
        const [usuarios] = await connection.promise().query(`
            SELECT id, nombre_usuario, tipo_usuario
            FROM usuarios
            ORDER BY id
        `);

        // HTML de respuesta con tarjetas de usuarios
        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Usuarios | VitalInvent</title>
            <style>
                :root {
                    --primary: #2c3e50;
                    --secondary: #3498db;
                    --success: #27ae60;
                    --warning: #f39c12;
                    --danger: #e74c3c;
                    --light: #ecf0f1;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f5f7fa;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                h1 {
                    color: var(--primary);
                    margin-bottom: 20px;
                    border-bottom: 2px solid var(--secondary);
                    padding-bottom: 10px;
                }
                
                .usuarios-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .usuario-card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 20px;
                    transition: transform 0.3s ease;
                }
                
                .usuario-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
                
                .usuario-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .usuario-id {
                    background: var(--light);
                    color: var(--primary);
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 0.9rem;
                }
                
                .usuario-nombre {
                    font-size: 1.3rem;
                    color: var(--primary);
                    margin: 0;
                }
                
                .usuario-rol {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    margin-top: 10px;
                }
                
                .rol-admin {
                    background: #d4edda;
                    color: #155724;
                }
                
                .rol-tecnico {
                    background: #cce5ff;
                    color: #004085;
                }
                
                .rol-medico {
                    background: #fff3cd;
                    color: #856404;
                }
                
                .btn {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: var(--secondary);
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 20px;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                @media (max-width: 768px) {
                    .usuarios-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div id="navbar"></div>
            
            <div class="container">
                <h1>Usuarios del Sistema</h1>
                
                ${usuarios.length > 0 ? `
                <div class="usuarios-grid">
                    ${usuarios.map(usuario => `
                    <div class="usuario-card">
                        <div class="usuario-header">
                            <h3 class="usuario-nombre">${usuario.nombre_usuario}</h3>
                            <span class="usuario-id">ID: ${usuario.id}</span>
                        </div>
                        
                        <div>
                            <span class="usuario-rol ${usuario.tipo_usuario === 'admin' ? 'rol-admin' : 
                                                     usuario.tipo_usuario === 'tecnico' ? 'rol-tecnico' : 'rol-medico'}">
                                ${usuario.tipo_usuario}
                            </span>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : `
                <div class="empty-state">
                    <h3>No hay usuarios registrados</h3>
                    <p>No se han encontrado usuarios en el sistema.</p>
                </div>
                `}
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="/" class="btn">Volver al inicio</a>
                </div>
            </div>
            
            <script>
                // Cargar navbar dinámico
                fetch('/api/user-info')
                    .then(response => response.json())
                    .then(data => {
                        const navbarHtml = \`
                            <nav style="background: #2563eb; color: white; padding: 15px;">
                                <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
                                    <a href="/" style="color: white; text-decoration: none; font-weight: bold; font-size: 1.2rem;">VitalInvent</a>
                                    <div style="display: flex; align-items: center; gap: 20px;">
                                        <span>Bienvenido, \${data.name}</span>
                                        <a href="/logout" style="color: white; text-decoration: none;">Cerrar sesión</a>
                                    </div>
                                </div>
                            </nav>
                        \`;
                        document.getElementById('navbar').innerHTML = navbarHtml;
                    })
                    .catch(error => {
                        console.error('Error loading user info:', error);
                        document.getElementById('navbar').innerHTML = '<nav style="background: #2c3e50; padding: 15px;"><a href="/" style="color: white; text-decoration: none;">VitalInvent</a></nav>';
                    });
            </script>
        </body>
        </html>
        `);
    } catch (err) {
        console.error('Error al cargar usuarios:', err);
        res.status(500).send(`
            <html>
            <head>
                <title>Error</title>
                <style>
                    .error-container {
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 30px;
                        background: #ffebee;
                        color: #c62828;
                        border-radius: 8px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h2>Error al cargar los usuarios</h2>
                    <p>Por favor, intente nuevamente más tarde.</p>
                    <a href="/" style="color: #1565c0; text-decoration: none;">Volver al inicio</a>
                </div>
            </body>
            </html>
        `);
    }
});
app.get('/mis-reportes', requireLogin, requireRole(['admin', 'medico']), async (req, res) => {
    try {
        const usuario_id = req.session.user.id;
        
        const [reportes] = await connection.promise().query(`
            SELECT 
                r.id,
                e.nombre_equipo,
                e.ubicacion,
                p.nombre_piso,
                r.descripcion,
                r.gravedad,
                r.fecha_reporte,
                e.estado as estado_equipo
            FROM reportes_mantenimiento r
            JOIN equipos_medicos e ON r.equipo_id = e.id
            JOIN pisos_hospital p ON e.piso_id = p.id
            WHERE r.usuario_id = ?
            ORDER BY r.fecha_reporte DESC
        `, [usuario_id]);

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mis Reportes | VitalInvent</title>
            <style>
                :root {
                    --primary: #2c3e50;
                    --secondary: #3498db;
                    --light: #ecf0f1;
                    --dark: #2c3e50;
                    --success: #27ae60;
                    --warning: #f39c12;
                    --danger: #e74c3c;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f5f7fa;
                    color: #333;
                    padding: 20px;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                h1 {
                    color: var(--primary);
                    margin-bottom: 30px;
                }
                
                .reportes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }
                
                .reporte-card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 20px;
                    border-left: 4px solid var(--secondary);
                }
                
                .reporte-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .reporte-title {
                    font-size: 1.2rem;
                    color: var(--primary);
                    margin: 0;
                }
                
                .reporte-id {
                    background: var(--light);
                    color: var(--dark);
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                }
                
                .reporte-details {
                    margin: 15px 0;
                }
                
                .detail-row {
                    display: flex;
                    margin-bottom: 8px;
                }
                
                .detail-label {
                    font-weight: bold;
                    width: 120px;
                    color: #7f8c8d;
                    flex-shrink: 0;
                }
                
                .detail-value {
                    color: #333;
                }
                
                .gravedad {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                }
                
                .gravedad-leve {
                    background-color: #fff3e0;
                    color: #e65100;
                }
                
                .gravedad-grave {
                    background-color: #ffebee;
                    color: #c62828;
                }
                
                .estado-equipo {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                }
                
                .estado-activo {
                    background-color: #e8f5e9;
                    color: #2e7d32;
                }
                
                .estado-reparacion {
                    background-color: #fff3cd;
                    color: #856404;
                }
                
                .estado-fuera {
                    background-color: #f8d7da;
                    color: #721c24;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .btn {
                    display: inline-block;
                    padding: 10px 20px;
                    background: var(--secondary);
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 20px;
                }
                
                @media (max-width: 768px) {
                    .reportes-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div id="navbar"></div>
            
            <div class="container">
                <h1>Mis Reportes de Mantenimiento</h1>
                
                ${reportes.length > 0 ? `
                <div class="reportes-grid">
                    ${reportes.map(reporte => `
                    <div class="reporte-card">
                        <div class="reporte-header">
                            <h3 class="reporte-title">${reporte.nombre_equipo}</h3>
                            <span class="reporte-id">ID: ${reporte.id}</span>
                        </div>
                        
                        <div class="reporte-details">
                            <div class="detail-row">
                                <span class="detail-label">Ubicación:</span>
                                <span class="detail-value">${reporte.ubicacion} (Piso ${reporte.nombre_piso})</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Fecha Reporte:</span>
                                <span class="detail-value">${new Date(reporte.fecha_reporte).toLocaleString()}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Gravedad:</span>
                                <span class="gravedad gravedad-${reporte.gravedad}">
                                    ${reporte.gravedad === 'grave' ? 'Grave' : 'Leve'}
                                </span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Estado Equipo:</span>
                                <span class="estado-equipo estado-${reporte.estado_equipo.split(' ')[0].toLowerCase()}">
                                    ${reporte.estado_equipo}
                                </span>
                            </div>
                            
                            <div class="detail-row" style="align-items: flex-start;">
                                <span class="detail-label">Descripción:</span>
                                <span class="detail-value">${reporte.descripcion}</span>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : `
                <div class="empty-state">
                    <h3>No has realizado ningún reporte aún</h3>
                    <p>Cuando reportes fallas en equipos médicos, aparecerán aquí.</p>
                    <a href="/" class="btn">Volver al inicio</a>
                </div>
                `}
            </div>
            
            <script>
                fetch('/navbar.html').then(r => r.text()).then(d => document.getElementById('navbar').innerHTML = d);
            </script>
        </body>
        </html>
        `;
        
        res.send(html);
    } catch (err) {
        console.error('Error al cargar mis reportes:', err);
        res.status(500).send(`
            <html>
            <head>
                <style>
                    .error-box { 
                        background: #f8d7da; 
                        color: #721c24; 
                        padding: 20px; 
                        max-width: 600px; 
                        margin: 50px auto; 
                        text-align: center; 
                        border-radius: 5px; 
                    }
                    .btn { 
                        background: #3498db; 
                        color: white; 
                        padding: 10px 15px; 
                        text-decoration: none; 
                        border-radius: 4px; 
                        display: inline-block; 
                        margin-top: 15px; 
                    }
                </style>
            </head>
            <body>
                <div id="navbar"></div>
                <div class="error-box">
                    <h2>Error al cargar tus reportes</h2>
                    <p>Por favor, intenta nuevamente más tarde.</p>
                    <a href="/" class="btn">Volver al inicio</a>
                </div>
                <script>
                    fetch('/navbar.html').then(r => r.text()).then(d => document.getElementById('navbar').innerHTML = d);
                </script>
            </body>
            </html>
        `);
    }
});
app.get('/bitacora-tecnico', requireLogin, requireRole(['admin', 'tecnico']), async (req, res) => {
    try {
        const tecnico_id = req.session.user.id;
        
        const [reportes] = await connection.promise().query(`
            SELECT 
                r.id,
                e.nombre_equipo,
                e.modelo,
                e.fabricante,
                e.ubicacion,
                p.nombre_piso,
                p.numero_piso,
                r.descripcion as problema,
                r.gravedad,
                r.fecha_reporte,
                r.fecha_solucion,
                r.acciones_realizadas,
                r.repuestos_utilizados,
                r.tiempo_invertido,
                e.estado as estado_actual,
                u.nombre_usuario as reportado_por
            FROM reportes_mantenimiento r
            JOIN equipos_medicos e ON r.equipo_id = e.id
            JOIN pisos_hospital p ON e.piso_id = p.id
            JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.tecnico_id = ?
            ORDER BY r.fecha_solucion DESC
        `, [tecnico_id]);

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bitácora de Mantenimiento | VitalInvent</title>
            <style>
                :root {
                    --primary: #2c3e50;
                    --secondary: #3498db;
                    --success: #27ae60;
                    --warning: #f39c12;
                    --danger: #e74c3c;
                    --light: #ecf0f1;
                    --dark: #2c3e50;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f5f7fa;
                    color: #333;
                    padding: 20px;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                h1 {
                    color: var(--primary);
                    margin-bottom: 30px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .h1-icon {
                    font-size: 1.5em;
                }
                
                .bitacora-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 20px;
                }
                
                .registro-card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 20px;
                    border-left: 4px solid var(--secondary);
                }
                
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                }
                
                .equipo-title {
                    font-size: 1.2rem;
                    color: var(--primary);
                    margin: 0;
                }
                
                .fecha {
                    color: #7f8c8d;
                    font-size: 0.9rem;
                }
                
                .card-body {
                    margin: 15px 0;
                }
                
                .detail-group {
                    margin-bottom: 12px;
                }
                
                .detail-label {
                    font-weight: bold;
                    color: #7f8c8d;
                    font-size: 0.9rem;
                    margin-bottom: 3px;
                }
                
                .detail-value {
                    color: #333;
                    padding-left: 10px;
                }
                
                .badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 0.85rem;
                }
                
                .badge-success {
                    background-color: #d4edda;
                    color: #155724;
                }
                
                .badge-warning {
                    background-color: #fff3cd;
                    color: #856404;
                }
                
                .badge-danger {
                    background-color: #f8d7da;
                    color: #721c24;
                }
                
                .badge-info {
                    background-color: #d1ecf1;
                    color: #0c5460;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    grid-column: 1 / -1;
                }
                
                .btn {
                    display: inline-block;
                    padding: 8px 16px;
                    background: var(--secondary);
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    margin-top: 10px;
                }
                
                @media (max-width: 768px) {
                    .bitacora-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div id="navbar"></div>
            
            <div class="container">
                <h1>
                    <span class="h1-icon">📋</span>
                    <span>Bitácora de Mantenimiento</span>
                </h1>
                
                ${reportes.length > 0 ? `
                <div class="bitacora-grid">
                    ${reportes.map(registro => `
                    <div class="registro-card">
                        <div class="card-header">
                            <h3 class="equipo-title">${registro.nombre_equipo}</h3>
                            <span class="fecha">${new Date(registro.fecha_solucion).toLocaleDateString()}</span>
                        </div>
                        
                        <div class="card-body">
                            <div class="detail-group">
                                <div class="detail-label">Problema reportado</div>
                                <div class="detail-value">${registro.problema}</div>
                            </div>
                            
                            <div class="detail-group">
                                <div class="detail-label">Acciones realizadas</div>
                                <div class="detail-value">${registro.acciones_realizadas}</div>
                            </div>
                            
                            <div class="detail-group">
                                <div class="detail-label">Repuestos utilizados</div>
                                <div class="detail-value">${registro.repuestos_utilizados || 'Ninguno'}</div>
                            </div>
                            
                            <div class="detail-group">
                                <div class="detail-label">Tiempo invertido</div>
                                <div class="detail-value">${registro.tiempo_invertido} horas</div>
                            </div>
                            
                            <div class="detail-group">
                                <div class="detail-label">Estado actual</div>
                                <div class="detail-value">
                                    <span class="badge ${
                                        registro.estado_actual === 'activo' ? 'badge-success' :
                                        registro.estado_actual.includes('reparación') ? 'badge-warning' :
                                        'badge-danger'
                                    }">
                                        ${registro.estado_actual}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="detail-group">
                                <div class="detail-label">Ubicación</div>
                                <div class="detail-value">Piso ${registro.numero_piso} - ${registro.nombre_piso}<br>${registro.ubicacion}</div>
                            </div>
                            
                            <div class="detail-group">
                                <div class="detail-label">Reportado por</div>
                                <div class="detail-value">${registro.reportado_por}</div>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : `
                <div class="empty-state">
                    <h3>No hay registros en tu bitácora</h3>
                    <p>Los mantenimientos que completes aparecerán aquí.</p>
                    <a href="/mantenimiento" class="btn">Ver reportes pendientes</a>
                </div>
                `}
            </div>
            
            <script>
                fetch('/navbar.html').then(r => r.text()).then(d => document.getElementById('navbar').innerHTML = d);
            </script>
        </body>
        </html>
        `;
        
        res.send(html);
    } catch (err) {
        console.error('Error al cargar la bitácora:', err);
        res.status(500).send(`
            <html>
            <head>
                <style>
                    .error-box { 
                        background: #f8d7da; 
                        color: #721c24; 
                        padding: 20px; 
                        max-width: 600px; 
                        margin: 50px auto; 
                        text-align: center; 
                        border-radius: 5px; 
                    }
                    .btn { 
                        background: #3498db; 
                        color: white; 
                        padding: 10px 15px; 
                        text-decoration: none; 
                        border-radius: 4px; 
                        display: inline-block; 
                        margin-top: 15px; 
                    }
                </style>
            </head>
            <body>
                <div id="navbar"></div>
                <div class="error-box">
                    <h2>Error al cargar la bitácora</h2>
                    <p>Por favor, intenta nuevamente más tarde.</p>
                    <a href="/" class="btn">Volver al inicio</a>
                </div>
                <script>
                    fetch('/navbar.html').then(r => r.text()).then(d => document.getElementById('navbar').innerHTML = d);
                </script>
            </body>
            </html>
        `);
    }
});
// Ruta para servir la página de búsqueda
app.get('/busqueda', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'busqueda.html'));
   });
// Ruta para buscar usuarios
   app.get('/buscar',requireLogin, requireRole(['admin', 'medico']), (req, res) => {
    const query = req.query.query;
 // Si la consulta está vacía, no realizar la búsqueda y devolver una respuesta vacía
    if (!query) {
    return res.json([]);  // Retorna un arreglo vacío para no mostrar nada
}
    const sql = `SELECT nombre_usuario, tipo_usuario FROM usuarios WHERE nombre_usuario LIKE ?`;
    connection.query(sql, [`%${query}%`], (err, results) => {
      if (err) {
        console.error('Error en la consulta SQL:', err);
        return res.status(500).json({ error: 'Error en la consulta' });
      }
      res.json(results);
    });
   });
// Ruta para servir la página de búsqueda
app.get('/busqueda2', requireLogin, requireRole(['admin', 'medico']), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'busqueda2.html'));
});

// Ruta para buscar usuarios
app.get('/buscar-equipo', requireLogin, requireRole(['admin', 'medico']), (req, res) => {
    const query = req.query.query;
    // Si la consulta está vacía, no realizar la búsqueda y devolver una respuesta vacía
    if (!query) {
        return res.json([]);  // Retorna un arreglo vacío para no mostrar nada
    }
    const sql = `SELECT nombre_equipo, estado, modelo, ubicacion FROM equipos_medicos WHERE nombre_equipo LIKE ?`;
    connection.query(sql, [`%${query}%`], (err, results) => {
        if (err) {
            console.error('Error en la consulta SQL:', err);
            return res.status(500).json({ error: 'Error en la consulta' });
        }
        res.json(results);
    });
});
// Ruta para servir la página de búsqueda
app.get('/busqueda3', requireLogin, requireRole(['admin', 'medico']), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'busqueda3.html'));
});
// Ruta para buscar usuarios
app.get('/buscar-piso', requireLogin, requireRole(['admin', 'medico']), (req, res) => {
    const query = req.query.query;
    // Si la consulta está vacía, no realizar la búsqueda y devolver una respuesta vacía
    if (!query) {
        return res.json([]);  // Retorna un arreglo vacío para no mostrar nada
    }
    const sql = `SELECT numero_piso, nombre_piso, responsable_piso FROM pisos_hospital WHERE numero_piso LIKE ?`;
    connection.query(sql, [`%${query}%`], (err, results) => {
        if (err) {
            console.error('Error en la consulta SQL:', err);
            return res.status(500).json({ error: 'Error en la consulta' });
        }
        res.json(results);
    });
});
 app.get('/menu',requireLogin, requireRole(['admin', 'medico']), (req, res) => {
    const menuItems = [
      { nombre: 'Inicio', url: '/index.html' },
      { nombre: 'Equipos', url: '/equipos.html' },
      { nombre: 'Usuarios', url: '/usuarios.html' },
      { nombre: 'Búsqueda', url: '/busqueda.html' }
    ];
    res.json(menuItems);
  });

// Ruta para CARGAR archivos (CORREGIDA)
app.post('/upload', upload.single('excelFile'), requireRole(['admin', 'medico']), async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    let data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Convertir fechas de Excel a formato MySQL
    data = data.map(row => {
      if (row.fecha_adquisicion) {
        // Si es un número (fecha serial de Excel)
        if (!isNaN(row.fecha_adquisicion)) {
          const excelDate = parseInt(row.fecha_adquisicion);
          // Conversión de fecha serial de Excel a fecha JavaScript
          const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
          // Formatear como YYYY-MM-DD
          row.fecha_adquisicion = date.toISOString().split('T')[0];
        }
      }
      return row;
    });

    // Insertar datos con manejo de errores
    const insertPromises = data.map(row => {
      return new Promise((resolve, reject) => {
        const { nombre_equipo, modelo, fabricante, fecha_adquisicion, estado, ubicacion, responsable, piso_id } = row;
        
        const sql = `INSERT INTO equipos_medicos 
          (nombre_equipo, modelo, fabricante, fecha_adquisicion, estado, ubicacion, responsable, piso_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        connection.query(sql, [
          nombre_equipo, 
          modelo, 
          fabricante, 
          fecha_adquisicion || null, 
          estado, 
          ubicacion, 
          responsable,
          piso_id
        ], (err) => {
          if (err) {
            console.error('Error insertando equipo:', { row, err });
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });

    await Promise.all(insertPromises);
res.send(`
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f8f9fa;
      margin: 0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #212529;
    }
    h1 {
      color: #28a745;
      margin-bottom: 20px;
    }
    a {
      display: inline-block;
      background-color: #007bff;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      text-decoration: none;
      transition: background-color 0.3s;
    }
    a:hover {
      background-color: #0056b3;
    }
  </style>
  <h1>Archivo cargado y datos guardados</h1>
  <a href="/equipos_medicos.html">Volver</a>
`);

} catch (error) {
  console.error('Error general:', error);
  res.status(500).send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f8f9fa;
        margin: 0;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        color: #212529;
      }
      h1 {
        color: #dc3545;
        margin-bottom: 15px;
      }
      p {
        color: #6c757d;
        max-width: 600px;
        text-align: center;
      }
    </style>
    <h1>Error al procesar el archivo</h1>
    <p>${error.message}</p>
  `);
}
 
});



// Ruta para DESCARGAR archivos (MEJORADA)
app.get('/download', requireRole(['admin', 'medico']), (req, res) => {
  const sql =' SELECT * FROM equipos_medicos';
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener equipos:', err);
      return res.status(500).send('Error al generar el reporte');
    }

    // Formatear resultados para mejor visualización en Excel
    const formattedResults = results.map(equipo => ({
      'ID': equipo.id,
      'Nombre del Equipo': equipo.nombre_equipo,
      'Modelo': equipo.modelo,
      'Fabricante': equipo.fabricante,
      'Fecha Adquisición': equipo.fecha_adquisicion,
      'Estado': equipo.estado,
      'Ubicación': equipo.ubicacion,
      'Responsable': equipo.responsable,
      'Piso ID': equipo.piso_id
    }));

    const worksheet = xlsx.utils.json_to_sheet(formattedResults);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Equipos Médicos');

    const filePath = path.join(__dirname, 'uploads', 'equipos_medicos.xlsx');
    xlsx.writeFile(workbook, filePath);
    
    res.download(filePath, 'equipos_medicos.xlsx', (err) => {
      if (err) {
        console.error('Error al descargar:', err);
        res.status(500).send('Error al descargar el archivo');
      }
    });
  });
});


// Iniciar el servidor
app.listen(3000, () => {
    console.log(`Servidor escuchando en http://localhost:3000`);
  });


