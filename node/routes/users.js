module.exports = function (app, usersRepository) {
    const emailRegexp = new RegExp("\\w*\\@\\w*\\.\\w*");
    const nombreYapellidosRegExp = new RegExp("[a-zA-Z]+('-'|' '[a-zA-Z])*");
    const pswdRegExp = new RegExp("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$")//passwords must have at least eight characters, with at least one letter and one number.
    app.get('/users', function (req, res) {
        res.send('lista de usuarios')
        ;
    })
    app.get('/users/login', function (req, res) {
        res.render("login.twig");
    });
    app.get('/users/logout', function (req, res) {
        req.session.user = null;
    });
    app.get('/users/signup', function (req, res) {
        res.render("signup.twig");
    });
    /**
     * Método que envía los datos de inicio de sesión a la base de datos, para identificar al usuario.
     * Recibe como parámetro una función, en la que se encripta la contraseña para que esta viaje de manera segura.
     * Una vez encriptada, se busca el conjunto email-contraseña(hash) en la base de datos mediante el repositorio de usuarios.
     *  Una vez se inicia sesión :
     *     si el usuario es administrador -> se le redirige a la vista de todos los usuarios de la app.
     *     si el usuario NO es administrador->se le redirige a la vista “Ver listado de usuarios de la red social”
     */
    app.post('/users/login', function (req, res) {
        if (req.body.email == null || req.body.password == null) {
            res.redirect("/users/login" +
                "?message=Debes rellenar todos los campos para iniciar sesión." +
                "&messageType=alert-danger ");
        } else if (!req.body.email.match(emailRegexp)) {
            res.redirect("/users/login" +
                "?message=El formato del email es incorrecto." +
                "&messageType=alert-danger ");
        } else {
            let securePassword = app.get("crypto").createHmac('sha256', app.get('clave'))
                .update(req.body.password).digest('hex');
            let filter = {
                email: req.body.email,
                password: securePassword
            }
            let options = {};

            usersRepository.findUser(filter, options).then(user => {
                if (user == null) {
                    req.session.user = null;

                    res.redirect("/users/login" +
                        "?message=Email o password incorrecto" +
                        "&messageType=alert-danger ");

                } else {
                    req.session.user = user.email;
                    res.redirect("/publications");
                }
            }).catch(error => {
                req.session.user = null;
                res.redirect("/users/login" +
                    "?message=Se ha producido un error al buscar el usuario" +
                    "&messageType=alert-danger ");
            })
            ;
        }
    });
    /**
     * Método mediante el cual se envían los datos necesarios para registrarse en la aplicación.
     * De nuevo, la contraseña será encriptada para que esta viaje de forma segura.
     * Si el usuario se registra correctamente, se le reenviará a la vista de login, para que inicie sesión si así lo desea.
     * El registro requiere email, nombre , apellidos y contraseña (así como un campo de repetición de la misma)
     * si alguno de los anteriores campos no ha sido completado o tiene errores, el usuario será notificado mediante mensajes de error.
     * -El email debe tener el formato nombre@dominio . El nombre y los apellidos no pueden contener números,
     * y la contraseña ha de contener al menos letras y números.
     * (Los mensajes de error se envían por medio de la URL)
     */
    app.post('/users/signup', function (req, res) {

        if (req.body.email == null || req.body.contraseña == null) {
            res.redirect("/users/signup" +
                "?message=Debes rellenar todos los campos para registrarte como usuario." +
                "&messageType=alert-danger ");
        } else if (!req.body.email.match(emailRegexp)) {
            res.redirect("/users/signup" +
                "?message=El formato del email es incorrecto." +
                "&messageType=alert-danger ");
        } else if (!req.body.nombre.match(nombreYapellidosRegExp) || !req.body.apellidos.match(nombreYapellidosRegExp)) {

            res.redirect("/users/signup" +
                "?message=Los campos de nombre y apellidos solamente aceptan letras , espacios o guiones." +
                "&messageType=alert-danger ");
        }else if(req.body.contraseña===req.body.repContra){

            res.redirect("/users/signup" +
                "?message=Las contraseñas no coinciden." +
                "&messageType=alert-danger ");

        } else {
            let securePassword = app.get("crypto").createHmac('sha256', app.get('clave'))
                .update(req.body.password).digest('hex');
            let user = {
                email: req.body.email,
                name:req.body.nombre,
                surname:req.body.apellidos,
                password: securePassword
            }
            usersRepository.insertUser(user).then(userId => {
                res.redirect("/users/login" + '?message=Nuevo usuario registrado.' + "&messageType=alert-info");
            }).catch(error => {
                res.redirect("/users/signup" + '?message=Se ha producido un error al registrar el usuario.' + "&messageType=alert-danger");
            });
        }
    });
}