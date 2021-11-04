//
// ---------- Import ------------------------------------
//

var express = require('express');
var nunjucks = require('nunjucks');
var address = 3000;
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');


//
// ---------- MIddlewares ---------------------------
//

// init une instance express
var app = express();
// rend static le fichier /css
app.use('/css', express.static(__dirname + '/CSS'));
// rend static le fichier /ressources
app.use('/ressources', express.static(__dirname + '/ressources'));
// set up le parser
app.use(bodyParser.urlencoded({ extended: true }));
// redirige toutes les requetes vers main.js
app.use('/', require('./routes/main.js'));

// set up l'app avec nunjucks
nunjucks.configure('views', {
    autoescape: true,
    express: app
});


//
// ---------- Lance l'app ---------------------------
//

// lance l'app sur le port défini
app.listen(address);
console.log(`Le serveur est lancé sur ${address}`);