//
// ---------- Import ------------------------------------------------------------------------------
//


var fs = require('fs');
var SHA256 = require('crypto-js/sha256');
var cryptico = require('cryptico');
var router = require('express').Router();


//
// ---------- Les variables -----------------------------------------------------------------------
//


let to_display = "";
let msg = "";


//
// ---------- Les redirections --------------------------------------------------------------------
//


// Page d'accueil
router.get('/', (req, res) => {
    res.redirect('/accueil');
});

// Page accueil
router.get('/accueil', (req, res) => {
    res.render('accueil.html', {
        to_display: to_display
    });
});

// Pop-up de connection
router.get('/accueil/connection', (req, res) => {
    // Si la personne est déjà connéctée
    if (to_display != "") {
        res.redirect('../arbreGen');
    } else {
        res.render('connection.html', {
            to_display: to_display
        });
    }
});

// Sotir de la pop-up
router.get('/annuler', (req, res) => {
    res.redirect('/accueil');
});

// Page d'inscription
router.get('/noAccount', (req, res) => {
    res.render('SignIn.html', {
        to_display: to_display
    });
});

// Page de changement de mot de passe
router.get('/forgot', (req, res) => {
    res.render('noPassWord.html', {
        to_display: to_display
    });
});

// Page de crétion de l'arbre généalogique
router.get('/arbreGen', (req, res) => {
    // Si la personne est connéctée
    if (to_display != "") {
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        // Essaye d'afficher l'arbre
        try {
            // Si il y a du monde dans la base de donnée
            if (result[0].personne.length != null) {
                res.redirect('/Tree');
            // Sinon redirige vers la création d'arbre
            } else {
                res.render('CreateTree.html', {
                    to_display: to_display
                });
            }
        } catch (error) {
            res.render('CreateTree.html', {
                to_display: to_display
            });
        }
    } else {
        res.redirect('/accueil');
    }
});

// Déconnection
router.get('/Deconnect', (req, res) => {
    to_display = "";
    res.redirect('/accueil');
});

// Page d'erreur TODO: intégrer les msg d'erreur dans la page et pas sur une nouvelle
router.get('/Erreur', (req, res) => {
    res.render('error.html', {
        to_display: to_display,
        msg: msg
    });
});

// Page d'arbre
router.get('/Tree/:id?', (req, res) => {
    // Essaye d'accéder au dossier user
    try {
        // Récupère et trie les personnes du dossier user
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        var persons = result[0].personne;
        let id;
        if (req.params.id != undefined) {
            id = req.params.id;
            // Essaye d'ouvrir le document userMail et de modifier
            try {
                var data = result[2];
                var keys = getKeys(data);
                if (keys.includes(user)) {
                    data[user].lastId = id;
                }
                var fs = require('fs');
                fs.writeFileSync("./UserData/userMail.json", JSON.stringify(data, null, 4));
            } catch (error) {
                msg = 'Le document UserMail est introvable';
            }
        } else {
            id = result[1];
        }
        // Si il y a des personnes dans la base de donnée
        if (persons.length != null) {
            for (var p of persons) {
                p = fromJson(p);
            }
            if (id != "") {
                var sortedPerson = selectGen(persons, findById(persons, id));
                res.render('DisplayTree.html', {
                    to_display: to_display,
                    persons: sortedPerson,
                    main: findById(persons, id)
                });
            } else {
                res.render("CreateTree.html", {
                  to_display: to_display
                });
            }
        } else {
            msg = "Document utilisateur introuvable";
            res.redirect('/Erreur');
        }
    } catch (error) {
        res.redirect('/accueil');
    }
});

// La page avce plus d'infos
router.get('/expand/:id', (req, res) => {
    // Essaye de récupérer les personnes de la base de donnée
    try {
        // Récupère la personne
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        var persons = result[0].personne;
        var id = req.params.id;
        // Essaye d'ouvrir le document userMail et de modifier
        try {
            var data = result[2];
            var keys = getKeys(data);
            if (keys.includes(user)) {
                data[user].lastId = id;
                var fs = require('fs');
                fs.writeFileSync("./UserData/userMail.json", JSON.stringify(data, null, 4));
            }
        } catch (error) {
            msg = 'Le document UserMail est introvable';
        }
        var person = findById(persons, id);
        person = fromJson(person);
        // Récupère sa famille et les affiche
        var parents = [];
        var enfants = [];
        var FrereSoeurs = [];
        var partenaire = [];
        var metier = person.metier[0];
        for (var p of person.parents) {
            parents.push(findById(persons, p));
        }
        for (var e of person.enfants) {
            enfants.push(findById(persons, e));
        }
        for (var fs of person.FrereSoeurs) {
            FrereSoeurs.push(findById(persons, fs));
        }
        for (var part of person.partenaire) {
            partenaire.push(findById(persons, part));
        }
        if (person != null) {
            res.render('expand.html', {
                to_display: to_display,
                p: person,
                parents: parents,
                FrereSoeurs: FrereSoeurs,
                enfants: enfants,
                partenaire: partenaire,
                metier: metier
            });
        } else {
            msg = "Document utilisateur introuvable";
            res.redirect('/Erreur');
        }
    } catch (err) {
        res.redirect('/accueil');
    }
});

// La page pour l'ajout de des parents
router.get('/AddParents/:id', (req, res) => {
    // Essaye d'accéder au dossier user
    try {
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        var persons = result[0].personne;
        var person = findById(persons, req.params.id);
        person = fromJson(person);
        // Si la personne existe
        if (person != null) {
            res.render('addParents.html', {
                to_display: to_display,
                p: person
            });
        } else {
            msg = "Document utilisateur introuvable";
            res.redirect('/Erreur');
        }
    } catch (error) {
        res.redirect('/accueil');
    }
});

// La page pour l'ajout de des freres et soeurs
router.get('/AddFreresoeur/:id', (req, res) => {
    // Essaye d'accéder au dossier user
    try {
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        var persons = result[0].personne;
        var person = findById(persons, req.params.id);
        person = fromJson(person);
        // Si la personne existe
        if (person != null) {
            res.render('addFrereSoeur.html', {
                to_display: to_display,
                p: person
            });
        } else {
            msg = "Document utilisateur introuvable";
            res.redirect('/Erreur');
        }
    } catch (error) {
        res.redirect('/accueil');
    }
});

// La page pour l'ajout de des enfants
router.get('/AddEnfants/:id', (req, res) => {
    // Essaye d'accéder au dossier user
    try {
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        var persons = result[0].personne;
        var person = findById(persons, req.params.id);
        person = fromJson(person);
        // Si la personne existe
        if (person != null) {
            res.render('addEnfants.html', {
                to_display: to_display,
                p: person
            });
        } else {
            msg = "Document utilisateur introuvable";
            res.redirect('/Erreur');
        }
    } catch (error) {
        res.redirect('/accueil');
    }
});

// La page pour l'ajout de de partenaire
router.get('/AddPartenaire/:id', (req, res) => {
    // Essaye d'accéder au dossier user
    try {
        // Récupère les informations de la personne
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        var persons = result[0].personne;
        var person = findById(persons, req.params.id);
        person = fromJson(person);
        // Si la personne existe
        if (person != null) {
            // Récupère les potentiels partenaires de la personne
            var sorted = selectGen(persons, person);
            for (var g of sorted) {
                var newg = [];
                for (var p of g) {
                    newg.push(p.Id);
                }
                if (newg.includes(person.Id)) {
                    gen = g;
                }
            }
            var goodgen = [];
            for (var p of gen) {
                if (p.Id != person.Id) {
                    goodgen.push(p);
                }
            }
            res.render('addPartenaire.html', {
                to_display: to_display,
                p: person,
                persons: goodgen
            });
        } else {
            msg = "Document utilisateur introuvable";
            res.redirect('/Erreur');
        }
    } catch (error) {
        res.redirect('/accueil');
    }
});

// La page pour l'ajout de de mariage
router.get('/AddMariage/:id', (req, res) => {
    // Essaye d'accéder au dossier user
    try {
        // récupère les informations de la personne
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        var persons = result[0].personne;
        var person = findById(persons, req.params.id);
        person = fromJson(person);
        // Si la personne existe
        if (person != null) {
            res.render('addMariage.html', {
                to_display: to_display,
                p: person
            });
        } else {
            msg = "Document utilisateur introuvable";
            res.redirect('/Erreur');
        }
    } catch (error) {
        res.redirect('/accueil');
    }
});

// La page pour l'ajout de de decès
router.get('/AddDeces/:id', (req, res) => {
    // Essaye d'accéder au dossier user
    try {
        // Récupère les informations de la personne
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        var persons = result[0].personne;
        var person = findById(persons, req.params.id);
        person = fromJson(person);
        // Si la personne existe
        if (person != null) {
            res.render('addDeces.html', {
                to_display: to_display,
                p: person
            });
        } else {
            msg = "Document utilisateur introuvable";
            res.redirect('/Erreur');
        }
    } catch (error) {
        res.redirect('/accueil');
    }
});

// La page pour l'ajout de de métier
router.get('/AddMetier/:id', (req, res) => {
    // Essaye d'accéder au dossier user
    try {
        // Récupère les informations de la personne
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        var persons = result[0].personne;
        var person = findById(persons, req.params.id);
        person = fromJson(person);
        // Si la personne existe
        if (person != null) {
            res.render('addMetier.html', {
                to_display: to_display,
                p: person
            });
        } else {
            msg = "Document utilisateur introuvable";
            res.redirect('/Erreur');
        }
    } catch (error) {
        res.redirect('/accueil');
    }
});

// La page pour modifier la personne
router.get('/Modif/:id', (req, res) => {
    // Essaye d'accéder au dossier user
    try {
        // Récupère les informations de la personne
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        var persons = result[0].personne;
        var person = findById(persons, req.params.id);
        person = fromJson(person);
        // Si la personne existe
        if (person != null) {
            // Récupère son / sa partenaire et les autres partenaires possibles
            let part;
            if (person.partenaire.length != 0) {
                part = findById(persons, person.partenaire[0]);
            } else {
                part = null;
            }
            var sorted = selectGen(persons, person);
            for (var g of sorted) {
                var newg = [];
                for (var p of g) {
                    newg.push(p.Id);
                }
                if (newg.includes(person.Id)) {
                    gen = g;
                }
            }
            var goodgen = [];
            for (var p of gen) {
                if (p.Id != person.Id && p.Id != part.Id) {
                    goodgen.push(p);
                }
            }
            res.render('Modif.html', {
                to_display: to_display,
                p: person,
                partenaire: part,
                persons: goodgen
            });
        } else {
            msg = "Document utilisateur introuvable";
            res.redirect('/Erreur');
        }
    } catch (error) {
        res.redirect('/accueil');
    }
});

// La page pour supprimer la personne
router.get('/Suppr/:id', (req, res) => {
    // Essaye d'accéder au dossier user
    try {
        // Récupère les informations de la personne
        var user = SHA256(to_display).toString();
        var result = openSession(user);
        var persons = result[0].personne;
        var person = findById(persons, req.params.id);
        // Si la personne existe
        if (person != null) {
            res.render('Suppr.html', {
                to_display: to_display,
                p: person
            });
        } else {
            msg = "Document utilisateur introuvable";
            res.redirect('/Erreur');
        }
    } catch (error) {
        res.redirect('/accueil');
    }
});


//
// ---------- Les actions -------------------------------------------------------------------------
//


// A la connection
router.get('/submit', (req, res) => {
    // Récupère les informations de la requête
    var user = req.query.name;
    var userN = SHA256(user).toString();
    var passW = SHA256(req.query.password).toString();
    // Si il existe le ficheir UserMail
    try {
        var dt = JSON.parse(fs.readFileSync("./UserData/userMail.json"));
        // Si le mot de passe est celui du doc
        if (dt[userN].password === passW) {
            to_display = user.toString();
            res.redirect('/accueil');
        }
    } catch (error) {
        // message a ajouter
        msg = 'Pas de fichier user trouvé';
        res.redirect('/Erreur');
    }
});

// Inscription
router.get('/signIn', (req, res) => {
    // Récupération des infos de la requête
    var user = req.query.name;
    var passW = SHA256(req.query.password).toString();
    var confirm = SHA256(req.query.confirm).toString();
    var userN = SHA256(user).toString();
    var fs = require('fs');
    // Si le mot de passe est celui du confirm sont identique
    if (passW === confirm) {
        var email = req.query.mail;
        // Essaye d'ouvrir le fichier contenant les infos de l'utilisateur
        let dt;
        try {
            dt = JSON.parse(fs.readFile("./UserData/" + userN + ".json"));
        } catch (err) {
            dt = {};
            fs.writeFile('./UserData/' + userN + '.json', JSON.stringify(dt, null, 4), (err) => {if (err) throw err});
        }
        // Essaye d'ouvrir le fichier contenant les address mails des utilisateurs
        let data;
        try {
            data = JSON.parse(fs.readFileSync("./UserData/userMail.json"));
        } catch (err) {
            data = {};
        }
        // Récupère les clées du fichier
        var key = getKeys(data);
        if (!key.includes(userN)) {
            // Enregistre les infos de la personns entrée
            data[userN] = {};
            data[userN].email = email;
            data[userN].password = passW;
            data[userN].lastId = "";
            fs.writeFileSync('./UserData/userMail.json', JSON.stringify(data, null, 4));
            to_display = user.toString();
            res.redirect('/arbreGen');
        }
    } else {
        // message a ajouter
        msg = "Mot de passe n'est pas correcte à la confirmation";
        res.redirect('/Erreur');
    }
});

// Change le mot de passe et rechiffre les données TODO: fichier user pas chiffré -> PB avec la f°
router.get('/changePass', (req, res) => {
    var fs = require('fs');
    // Récupère les mots de passe
    var passW = SHA256(req.query.password).toString();
    var confirm = SHA256(req.query.confirm).toString();
    // Si le mot de passe est égal à confirm
    if (passW === confirm) {
        var user = req.query.name;
        var userN = SHA256(user).toString();
        // Essaye d'ouvrir le fichier untilisateur
        try {
            var data = JSON.parse(fs.readFileSync("./UserData/userMail.json"));
            var keys = getKeys(data);
            if (keys.includes(userN)) {
                var lastPass = data[userN].password;
                data[userN].password = passW;
                // Essaye de déchiffrer puis de rechiffrer avec le nouveau mot de passe
                try {
                    var dt = JSON.parse(fs.readFileSync("./UserData/" + userN + ".json"));
                    var rsa = cryptico.generateRSAKey(lastPass, 1024);
                    var newRsa = cryptico.generateRSAKey(passW, 1024);
                    var newPublicKey = cryptico.publicKeyString(newRsa);
                    dt = decrypt(dt, rsa);
                    dt = encrypt(dt, newPublicKey);
                    fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(dt, null, 4));
                    fs.writeFileSync('./UserData/userMail.json', JSON.stringify(data, null, 4));
                    to_display = user.toString();
                    res.render('layout.html', {
                        to_display: to_display
                    });
                } catch (err) {
                    msg = 'Pas de fichier user trouvé';
                    res.redirect('/Erreur');
                }
            }
        } catch (err) {
            msg = 'Pas de fichier mail';
            res.redirect('/Erreur');
        }
    } else {
        msg = "Mot de passe n'est pas correcte à la confirmation";
        res.redirect('/Erreur');
    }
});

// Créer la première personne de l'arbre généalogique
router.get('/CreateTree', (req, res) => {
    var fs = require('fs');
    // Récupère les informations de la requête et les vérifient
    var name = req.query.nom;
    var prenom = req.query.prenom;
    var naissance = req.query.naissance.split("-");
    for (var x of naissance) {
        x = Number(x);
    }
    let sexe = "";
    if (req.query.sexe === "homme") {
        sexe = "m";
    } else if (req.query.sexe === "femme") {
        sexe = "f";
    } else {
        msg = "Le sexe n'est pas renseigné";
        res.redirect('/Erreur');
        return;
    }
    if (name != "" && prenom != "" && naissance.length != 0 && sexe != "") {
        // Crée une nouvelle personne et ouvre le fichier user
        var person = new Person(name, prenom, naissance, sexe);
        var userN = SHA256(to_display).toString();
        var result = openSession(userN);
        // Essaye d'enegistrer la personne dans le fichier user
        try {
            var data = result[0].personne[0];
            if (data != null) {
                // Essaye d'ouvrir le document userMail et de modifier
                try {
                    var d = result[2];
                    var keys = getKeys(d);
                    if (keys.includes(userN)) {
                        d[userN].lastId = data.Id;
                    }
                    fs.writeFileSync("./UserData/userMail.json", JSON.stringify(d, null, 4));
                } catch (error) {
                    msg = 'Le document UserMail est introvable';
                }
                data.personne.push(person);
                fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(data, null, 4));
                res.redirect('/Tree');
            } else {
            }
        } catch (error) {
            var dt = JSON.parse(fs.readFileSync("./UserData/userMail.json"));
            if (dt[userN].lastId === "") {
                var p = JSON.parse(fs.readFileSync("./UserData/" + userN + ".json"));
                p['personne'] = [person];
                fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(p, null, 4));
                dt[userN].lastId = person.Id;
                fs.writeFileSync("./UserData/userMail.json", JSON.stringify(dt, null, 4));
                res.redirect('/Tree');
            }
        }
    } else {
        msg = "Le nom, le prénom ou la date de naissance n'est pas renseigné";
        res.redirect('/Erreur');
    }
});

// Ajoute un parent à la personne
router.get('/addParent/:id', (req, res) => {
    var fs = require('fs');
    // Récupère les informations de la requête
    var name = req.query.nom;
    var prenom = req.query.prenom;
    var naissance = req.query.naissance.split("-");
    for (var x of naissance) {
        x = Number(x);
    }
    let sexe = "";
    if (req.query.sexe === "homme") {
        sexe = "m";
    } else if (req.query.sexe === "femme") {
        sexe = "f";
    } else {
        msg = "Le sexe n'est pas renseigné";
        res.redirect('/Erreur');
        return;
    }
    // Si les informations sont complétes
    if (name != "" && prenom != "" && naissance.length != 0 && sexe != "") {
        // Crée une nouvelle personne et lui donne un id
        var parent = new Person(name, prenom, naissance, sexe);
        var userN = SHA256(to_display).toString();
        var result = openSession(userN);
        var persons = result[0].personne;
        var ok = false;
        let id;
        while (!ok) {
            id = ID();
            var compteur = 0;
            for (var p of persons) {
                if (p.Id === id) {
                    compteur++;
                }
            }
            if (compteur === 0) {
                ok = true;
            }
        }
        parent.SetId(id);
        // Cherche l'enfant de la nouvelle personne
        var data = findById(persons, req.params.id);
        // Si la personne existe
        if (data != null) {
            // Met dans la liste des parents de l'enfant le parent
            data.parents.push(parent.Id);
            parent.enfants.push(data.Id);
            // Met dans la liste des enfants du parent les frere et soeurs de l'enfant
            if (data.FrereSoeurs.length != 0) {
                for (var fs of data.FrereSoeurs) {
                    fs = findById(persons, fs);
                    fs.parents.push(parent.Id);
                    parent.enfants.push(fs.Id);
                }
            }
            // Update du nombre d'enfants du parent
            parent.nbOfChilds = [data.nbOfChilds[0] + 1];
            // Update du nombre de parent de l'enfant
            data.nbOfParents = [data.nbOfParents[0] + 1];
            result[0].personne.push(parent);
            fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(result[0], null, 4));
            res.redirect('/expand/' + data.Id);
        } else {
            msg = "L'utilisatuer n'est pas dans le fichier mail";
            res.redirect('/Erreur');
        }
    } else {
        msg = "Le nom, le prénom ou la date de naissance n'est pas renseigné";
        res.redirect('/Erreur');
    }
});

// Ajoute un parent à la personne
router.get('/addEnfant/:id', (req, res) => {
    var fs = require('fs');
    // Récupère les informations de la requête et les vérifi
    var name = req.query.nom;
    var prenom = req.query.prenom;
    var naissance = req.query.naissance.split("-");
    for (var x of naissance) {
        x = Number(x);
    }
    let sexe = "";
    if (req.query.sexe === "homme") {
        sexe = "m";
    } else if (req.query.sexe === "femme") {
        sexe = "f";
    } else {
        msg = "Le sexe n'est pas renseigné";
        res.redirect('/Erreur');
        return;
    }
    if (name != "" && prenom != "" && naissance.length != 0 && sexe != "") {
        // Crée la personne
        var enfant = new Person(name, prenom, naissance, sexe);
        var userN = SHA256(to_display).toString();
        var result = openSession(userN);
        var persons = result[0].personne;
        var ok = false;
        let id;
        while (!ok) {
            id = ID();
            var compteur = 0;
            for (var p of persons) {
                if (p.Id === id) {
                    compteur++;
                }
            }
            if (compteur === 0) {
                ok = true;
            }
        }
        enfant.SetId(id);
        var data = findById(persons, req.params.id);
        // Si le parent existe
        if (data != null) {
            // Met l'enfant dans la liste enfants du / des parent(s)
            data.enfants.push(enfant.Id);
            enfant.parents.push(data.Id);
            if (data.partenaire.length != 0 ){
                var part = findById(persons, data.partenaire[0]);
                part.enfants.push(enfant.Id);
                enfant.parents.push(part.Id);
            }
            // Met l'enfant dans la liste des freresoeur de ses freres et soeurs
            for (var enf of data.enfants) {
                if (enf != enfant.Id) {
                    enf = findById(persons, enf);
                    enf.FrereSoeurs.push(enfant.Id);
                    enfant.FrereSoeurs.push(enf.Id);
                }
            }
            // Update du nombre d'enfants du parent
            if (data.nbOfChilds[0] === 0) {
                data.nbOfChilds = [1];
            }
            // Update du nombre de parent de l'enfant
            enfant.nbOfParents = [data.nbOfParents[0] + 1];
            // Enregiste les changements
            result[0].personne.push(enfant);
            fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(result[0], null, 4));
            res.redirect('/expand/' + data.Id);
        } else {
            msg = "L'utilisatuer n'est pas dans le fichier mail";
            res.redirect('/Erreur');
        }
    } else {
        msg = "Le nom, le prénom ou la date de naissance n'est pas renseigné";
        res.redirect('/Erreur');
    }
});

// Ajoute un parent à la personne
router.get('/addFS/:id', (req, res) => {
    var fs = require('fs');
    // Récupère les informations de la requête et les vérifi
    var name = req.query.nom;
    var prenom = req.query.prenom;
    var naissance = req.query.naissance.split("-");
    for (var x of naissance) {
        x = Number(x);
    }
    let sexe = "";
    if (req.query.sexe === "homme") {
        sexe = "m";
    } else if (req.query.sexe === "femme") {
        sexe = "f";
    } else {
        msg = "Le sexe n'est pas renseigné";
        res.redirect('/Erreur');
        return;
    }
    if (name != "" && prenom != "" && naissance.length != 0 && sexe != "") {
        // Crée une nouvelle personne
        var enfant = new Person(name, prenom, naissance, sexe);
        var userN = SHA256(to_display).toString();
        var result = openSession(userN);
        var persons = result[0].personne;
        var ok = false;
        let id;
        while (!ok) {
            id = ID();
            var compteur = 0;
            for (var p of persons) {
                if (p.Id === id) {
                    compteur++;
                }
            }
            if (compteur === 0) {
                ok = true;
            }
        }
        enfant.SetId(id);
        var data = findById(persons, req.params.id);
        // Si le frere ou la soeur existe
        if (data != null) {
            // Met le personne dans la liste freresoeurs de ses freres et soeurs
            if (data.FrereSoeurs) {
                for (var frs of data.FrereSoeurs) {
                    frs = findById(persons, frs);
                    frs.FrereSoeurs.push(enfant.Id);
                    enfant.FrereSoeurs.push(frs.Id);
                }
            }
            // Update du nombre de parents de la personne
            enfant.nbOfParents = [data.nbOfParents[0]];
            // Met la personne dans la liste de ses parents
            if (data.parents) {
                for (var par of data.parents) {
                    par = findById(persons, par);
                    par.enfants.push(enfant.Id);
                    enfant.parents.push(par.Id);
                }
            }
            enfant.FrereSoeurs.push(data.Id);
            data.FrereSoeurs.push(enfant.Id);
            result[0].personne.push(enfant);
            fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(result[0], null, 4));
            res.redirect('/expand/' + data.Id);
        } else {
            msg = "L'utilisatuer n'est pas dans le fichier mail";
            res.redirect('/Erreur');
        }
    } else {
        msg = "Le nom, le prénom ou la date de naissance n'est pas renseigné";
        res.redirect('/Erreur');
    }
});

// Ajoute le/la partenaire
router.get('/addPart/:id', (req, res) => {
    var fs = require('fs');
    // Si il y a une personne comme partenaire
    if (req.query.ID != "") {
        // Récupère les informations de la personne
        var userN = SHA256(to_display).toString();
        var result = openSession(userN);
        var persons = result[0].personne;
        var data = findById(persons, req.query.id);
        var part = findById(persons, req.query.ID);
        // Si la personne existe
        if (data != null) {
            // Enregistre le / la partenaire de la personne
            if (data.partenaire.length != 0) {
                data.partenaire = [];
                data.partenaire.push(part.Id);
            } else {
                data.partenaire.push(part.Id);
            }
            if (part.partenaire.length != 0) {
                part.partenaire = [];
                part.partenaire.push(part.Id);
            } else {
                part.partenaire.push(data.Id);
            }
            fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(result[0], null, 4));
            res.redirect('/Tree');
        } else {
            msg = "L'utilisatuer n'est pas dans le fichier mail";
            res.redirect('/Erreur');
        }
    } else {
        // Récupère les informations et les vérifient
        var name = req.query.nom;
        var prenom = req.query.prenom;
        var naissance = req.query.naissance.split("-");
        for (var x of naissance) {
            x = Number(x);
        }
        let sexe = "";
        if (req.query.sexe === "homme") {
            sexe = "m";
        } else if (req.query.sexe === "femme") {
            sexe = "f";
        } else {
            msg = "Le sexe n'est pas renseigné";
            res.redirect('/Erreur');
            return;
        }
        if (name != "" && prenom != "" && naissance.length != 0 && sexe != "") {
            var data = findById(persons, req.params.id);
            if (data != null) {
                // Crée la personne et l'enregistre
                var part = new Person(name, prenom, naissance, sexe);
                var userN = SHA256(to_display).toString();
                var result = openSession(userN);
                var persons = result[0].personne;
                var ok = false;
                let id;
                while (!ok) {
                    id = ID();
                    var compteur = 0;
                    for (var p of persons) {
                        if (p.Id === id) {
                            compteur++;
                        }
                    }
                    if (compteur === 0) {
                        ok = true;
                    }
                }
                part.SetId(id);
                part.partenaire.push(data.Id);
                if (data.partenaire.length != 0) {
                    data.partenaire = [];
                    data.partenaire.push(part.Id);
                } else {
                    data.partenaire.push(part.Id);
                }
                result[0].personne.push(partenaire);
                fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(result[0], null, 4));
                res.redirect('/expand/' + data.Id);
            } else {
                msg = "L'utilisatuer n'est pas dans le fichier mail";
                res.redirect('/Erreur');
            }
        } else {
            msg = "Le nom, le prénom ou la date de naissance n'est pas renseigné";
            res.redirect('/Erreur');
        }
    }
});

// Ajoute le métier de la personne
router.get('/addMet/:id', (req, res) => {
    var fs = require('fs');
    // Récupère le métier
    var metier = req.query.metier;
    // Si il existe
    if (metier != null) {
        var userN = SHA256(to_display).toString();
        var result = openSession(userN);
        var persons = result[0].personne;
        var data = findById(persons, req.params.id);
        // Si la personne existe
        if (data != null) {
            data.metier.push(metier);
            fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(result[0], null, 4));
            res.redirect('/expand/' + data.Id);
        } else {
            msg = "pas de donnée";
            res.redirect('/Erreur');
        }
    } else {
        res.redirect('/Erreur');
    }
});

// Ajoute la date de mariage TODO: 0 vérif
router.get('/addMar/:id', (req, res) => {
    var fs = require('fs');
    // Récupère la date de mariage
    var date = req.query.mariage.split("-");
    // Si elle existe
    if (date != null) {
        var userN = SHA256(to_display).toString();
        var result = openSession(userN);
        var persons = result[0].personne;
        var data = findById(persons, req.params.id);
        // Si la personne existe
        if (data != null) {
            var part = data.partenaire;
            data.dateMariage = date;
            part.dateMariage = date;
            fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(result[0], null, 4));
            res.redirect('/expand/' + data.Id);
        } else {
            msg = "pas de donnée";
            res.redirect('/Erreur');
        }
    } else {
        res.redirect('/Erreur');
    }
});

// Ajoute la date de mariage TODO: 0 vérif
router.get('/addDec/:id', (req, res) => {
    var fs = require('fs');
    // Récupère la date de décès
    var date = req.query.deces.split("-");
    // Si elle existe
    if (date != null) {
        var userN = SHA256(to_display).toString();
        var result = openSession(userN);
        var persons = result[0].personne;
        var data = findById(persons, req.params.id);
        // Si la personne existe
        if (data != null) {
            data.dateDeces = date;
            fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(result[0], null, 4));
            res.redirect('/expand/' + data.Id);
        } else {
            msg = "pas de donnée";
            res.redirect('/Erreur');
        }
    } else {
        res.redirect('/Erreur');
    }
});

// Modifie les informations dela personne
router.get('/ModifPers/:id', (req, res) => {
    var fs = require('fs');
    // Récupère les informations de la requête et les vérifie
    var name = req.query.nom;
    var prenom = req.query.prenom;
    var naissance = req.query.naissance.split("-");
    var metier = req.query.metier;
    var part = req.query.ID;
    var mariage = req.query.mariage;
    var deces = req.query.deces;
    for (var x of naissance) {
        x = Number(x);
    }
    let sexe = "";
    if (req.query.sexe === "homme") {
        sexe = "m";
    } else if (req.query.sexe === "femme") {
        sexe = "f";
    } else {
        msg = "Le sexe n'est pas renseigné";
        res.redirect('/Erreur');
        return;
    }
    if (name != undefined || prenom != undefined || naissance != undefined || metier != undefined || part != undefined || mariage != undefined || deces != undefined || sexe != undefined) {
        // Récupère les informations user
        var userN = SHA256(to_display).toString();
        var result = openSession(userN);
        var persons = result[0].personne;
        var data = findById(persons, req.params.id);
        // Si la personne existe
        if (data != null) {
            // Change les paramêtres à changer et sauvegarde
            if (name != undefined) {
                data.nom = name;
            }
            if (prenom != undefined) {
                data.prenom = prenom;
            }
            if (naissance != undefined) {
                data.dateNaissance = naissance;
            }
            if (sexe != undefined) {
                data.sexe = sexe;
            }
            if (metier != undefined) {
                data.metier = [metier];
            }
            if (part != undefined) {
                data.partenaire = [findById(persons, part).Id];
            }
            if (mariage != undefined) {
                data.dateMariage = mariage.split("-");
            }
            if (deces != undefined) {
                data.dateDeces = deces.split("-");
            }
            fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(result[0], null, 4));
            res.redirect('/expand/' + data.Id);
        } else {
            msg = "pas de donnée";
            res.redirect('/Erreur');
        }
    } else {
        msg = "Le nom, le prénom ou la date de naissance n'est pas renseigné";
        res.redirect('/Erreur');
    }
});

// Supprime la personne
router.get('/SupprimerPers/:id', (req, res) => {
    var fs = require('fs');
    // Essaye de supprimer la personne
    try {
        // Récupère la personne
        var userN = SHA256(to_display).toString();
        var result = openSession(userN);
        var persons = result[0].personne;
        var data = findById(persons, req.params.id);
        var id = "";
        // Pour chaque parent
        for (var p of data.parents) {
            p = findById(persons, p);
            // Si il a un enfant de la personne
            if (p.enfants.length != 0) {
                // Pour chaque enfant du parent
                for (var x = 0; x < p.enfants.length; x++) {
                    // Si l'enfant est la personne à supprimer
                    if (p.enfants[x] === data.Id) {
                        // Supprime l'enfant
                        p.enfants.splice(x, 1);
                    }
                }
            }
        }
        // Pour chaque enfant de la personne
        for (var p of data.enfants) {
            p = findById(persons, p);
            // Si l'enfant a un parent
            if (p.parents.length != 0) {
                // Pour chaque parent
                for (var y = 0; y < p.parents.length; y++) {
                    // Si le parent est la perosnne à supprimer
                    if (p.parents[x] === data.Id) {
                        // Supprime le parent
                        p.parents.splice(x, 1);
                    }
                }
            }
        }
        // Pour chaque frère et soeur
        for (var fs of data.FrereSoeurs) {
            fs = findById(persons, fs);
            // Si le frère ou la soeur a des frères ou soeurs
            if (fs.FrereSoeurs.length != 0) {
                // Pour chaqun d'entre eux
                for (var y = 0; y < fs.FrereSoeurs.length; y++) {
                    // Si c'est la peronne a supprimer
                    if (fs.FrereSoeurs[x] === data.Id) {
                        // Suprime la personne
                        fs.FrereSoeurs.splice(x, 1);
                    }
                }
            }
        }
        // Pour chaque partenaire
        for (var p of data.partenaire) {
            p = findById(persons, p);
            // Si le / la partenaire a une partenaire
            if (p.partenaire.length != 0) {
                // Pour chaque partenaire du partenaire
                for (var y = 0; y < p.partenaire.length; y++) {
                    // Si le partenaire est la personne
                    if (p.partenaire[x] === data.Id) {
                        // Supprime le partenaire
                        p.partenaire.splice(x, 1);
                    }
                }
            }
        }
        // Supprime la personne de la base de donnée
        for (var x = 0; x < persons.length; x++) {
            if (persons[x].Id === data.Id) {
                persons.splice(x, 1);
            }
        }
        // Essaye d'ouvrir le document userMail et de modifier
        try {
            var data = result[2];
            var keys = getKeys(data);
            if (keys.includes(userN)) {
                data[userN].lastId = id;
            }
            var fs = require('fs');
            fs.writeFileSync("./UserData/userMail.json", JSON.stringify(data, null, 4));
        } catch (error) {
            msg = 'Le document UserMail est introvable';
        }
        fs.writeFileSync('./UserData/' + userN + '.json', JSON.stringify(result[0], null, 4));
        res.redirect('/Tree/' + data.Id);
    } catch (err) {
        msg = "pas de donnée";
        res.redirect('/Erreur');
    }
});


//
// ---------- Les fonctions -----------------------------------------------------------------------
//


// Retourne la liste des keys du dict
function getKeys(dict) {
    /**
     * itype : {}
     * rtype : []
     */
    var keys = [];
    for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
}

// chiffre toutes les données avec la clée publique
function encrypt(dict, publicKey) {
    /**
     * itype : 2 {}
     * rtype : {}
     */
    var keys = getKeys(dict);
    for (var key of keys) {
        dict[key] = cryptico.encrypt(dict[key], publicKey).cipher;
    }
    return dict;
}

// chiffre toutes les données avec la clée publique
function decrypt(dict, rsaKey) {
    /**
     * itype : 2 {}
     * rtype : {}
     */
    var keys = getKeys(dict);
    for (var key of keys) {
        dict[key] = cryptico.decrypt(dict[key], rsaKey).plaintext;
    }
    return dict;
}

// Retourne un id unique
function ID() {
    /**
     * rtype : str
     */
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

// Retourne les données de l'utilisateur séléctionné
function openSession(name) {
    /**
     * itype : str
     * rtype : []
     */
    // Essaye d'ouvrir le document userMail
    try {
        var data = JSON.parse(fs.readFileSync("./UserData/userMail.json"));
        var keys = getKeys(data);
        if (keys.includes(name)) {
            var lastId = data[name].lastId;
            // Essaye d'ouvrir le fichier user
            try {
                var dt = JSON.parse(fs.readFileSync("./UserData/" + name + ".json"));
                return [dt, lastId, data];
            } catch (error) {
                return [null, null, null];
            }
        } else {
            return [null, null, null];
        }
    } catch (error) {
        return [null, null, null];
    }
}

// Compare deux date, true si d1 est né avant d2, false sinon
function compareDate(d1, d2) {
    /**
     * itype : 2 []
     * rtype : bool
     */
    if (Number(d1[0]) < Number(d2[0])) {
        return -1;
    } else if (Number(d1[1]) < Number(d2[1])) {
        return -1;
    } else if (Number(d1[2]) < Number(d2[2])) {
        return -1;
    } else {
        return 1;
    }
}


//
// ---------- La classe Person --------------------------------------------------------------------
//


class Person {
    constructor(nom, prenom, dateNaissance, sexe) {
        // Id unique pour différencier
        this.Id = ID(); // NE FONCTIONNE PAS !!!
        // Le nom de famille
        this.nom = nom;
        // Le prénom de la personne
        this.prenom = prenom;
        // La date de naissance
        this.dateNaissance = dateNaissance;
        // Le sexe de la personns
        this.sexe = sexe;
        // Le nombre d'enfants + petits enfants + ...
        this.nbOfChilds = [0];
        // Le nombre de parents + grand-parents + ...
        this.nbOfParents = [0];
        // La liste des ID des enfants de la personne
        this.enfants = [];
        // La liste des ID des frères et soeurs de la personne
        this.FrereSoeurs = [];
        // La liste des ID des parents de la personne
        this.parents = [];
        // l'ID du / de la partenaire de la personne
        this.partenaire = [];
        // Le métier de la personne
        this.metier = [];
        // La date de mariage de la personne
        this.dateMariage = [];
        // La date de décès de la personne
        this.dateDeces = [];
    }

    //
    // ---------- Json -> Person ----------------------------------
    //

    // Affecte les paramètres de la classe avec ceux entrés
    SetParam(Id, nbOfChilds, nbOfParents, enfants, FrereSoeurs, parents, partenaire, metier, dateMariage, dateDeces) {
        /**
         * itype : str, 9 []
         */
        this.Id = Id;
        this.nbOfChilds[0] = nbOfChilds[0];
        this.nbOfParents[0] = nbOfParents[0];
        this.enfants = enfants;
        this.FrereSoeurs = FrereSoeurs;
        this.parents = parents;
        this.partenaire = partenaire;
        this.metier = metier;
        this.dateMariage = dateMariage;
        this.dateDeces = dateDeces;
    }

    SetId(id) {
        /**
         * itype : str
         */
        this.Id = id;
    }
}


//
// ---------- Fonctions liées à la classe Person --------------------------------------------------
//


// Transforme un objet Json en objet Person
var fromJson = function (data) {
    /**
     * itype : {}
     * rtype : Objet (Person)
     */
    var p = new Person(data.nom, data.prenom, data.dateNaissance, data.sexe);
    p.SetParam(data.Id, data.nbOfChilds, data.nbOfParents, data.enfants, data.FrereSoeurs, data.parents, data.partenaire, data.metier, data.dateMariage, data.dateDeces);
    return p;
};

// Retourne l'objet correspondant à l'id demandé
var findById = function (list, id) {
    /**
     * itype : [], str
     * rtype : Objet (Person)
     */
    for (var obj of list) {
        if (obj.Id === id) {
            return obj;
        }
    }
};

// Trouve la personne avec la date de naissance TODO: jumeaux ?
var findByDate = function (list, date) {
    /**
     * itype : [Ojbet (Person)], []
     * rtype : Objet (Person)
     */
    for (var obj of list) {
        if (obj.dateNaissance === date) {
            return obj;
        }
    }
}

// Trie les personnes par leur date de naissance
var sortByDate = function (list) {
    /**
     * itype : [Objet (Person)]
     * rtype : [Objet (Person)]
     */
    var listDate = [];
    var final = [];
    for (var p of list) {
        listDate.push(p.dateNaissance);
    }
    listDate = listDate.sort();

    for (var d of listDate) {
        final.push(findByDate(list, d));
    }
    return final;
}

// Trie les personne par leur sexe (sert uniquement pour mettre en ordre les parents)
var sortBySexe = function(list) {
    /**
     * itype : [Objet (Person)]
     * rtype : [Objet (Person)]
     */
    var final = [];
    for (var p of list) {
        if (p.sexe === "m") {
            final.push(p);
        }
    }
    for (var p of list ) {
        if (p.sexe === 'f') {
            final.push(p);
        }
    }
    return final
}

// Selectionne une partie de l'arbre en fonction de la personne entrée
var selectGen = function (list, p) {
    /**
     * itype : [Objet (Person)], Objet (Person)
     * rtype : [Objet (Person)]
     */
    var parentsGen = [[]];
    var nbGen = 0;

    // Recherche les parents direct de p

    // Si la personne a des parents
    if (p.parents.length != 0) {
        var subGen = [];
        // Pour chaque parent de la personne
        for (var par of p.parents) {
            par = findById(list, par);
            // Si le parent n'est pas dans la liste
            if (!subGen.includes(par)) {
                subGen.push(par);
            }
        }
        subGen = sortBySexe(subGen);
        for (var s of subGen) {
            parentsGen[nbGen].push(s);
        }
    }

    // Recherche tout les parents des parents tant qu'il y en a

    // Tant que la dernière liste de parents n'est pas vide
    while (parentsGen[nbGen].length != 0) {
        // Crée une liste dans parentsGen et passe à la génération d'après
        nbGen ++;
        parentsGen.push([]);
        // Pour chaque personne de la liste
        for (var par of parentsGen[nbGen - 1]) {
            var subGen = [];
            // Pour chaque parent de la personne
            for (var parents of par.parents) {
                var parents = findById(list, parents);
                // Si le parent n'est pas dans la liste
                if (!subGen.includes(parents)) {
                    subGen.push(parents);
                }
            }
            subGen = sortBySexe(subGen);
            for (var s of subGen) {
                parentsGen[nbGen].push(s);
            }
        }
    }
    // Remet la liste dans le bon ordre (plus ancien au plus récent)
    parentsGen = parentsGen.reverse();
    // Enlève la première liste (elle est normallement vide)
    parentsGen.shift();
    // Ajoute une liste a la fin
    parentsGen.push([]);

    // Met la génération de la personne
    var freresoeur = [p];
    // Si la personne a des freres et soeurs
    if (p.FrereSoeurs.length != 0) {
        // Pour chaqun d'entre eux
        for (var frs of p.FrereSoeurs) {
            freresoeur.push(findById(list, frs));
        }
    }
    // Trie la liste par date de naissance
    freresoeur = sortByDate(freresoeur);
    // Pour chaque personne de la liste
    for (var x = 0; x < freresoeur.length; x++) {
        parentsGen[nbGen].push(freresoeur[x]);
        // Si la personne a un / une partenaire
        if (freresoeur[x].partenaire.length != 0) {
            var part = findById(list, freresoeur[x].partenaire[0]);
            // Si le / la partenaire n'est pas dans la liste
            if (!parentsGen[nbGen].includes(part)) {
                parentsGen[nbGen].push(part);
            }
        }
    }

    // met les générations suivants la génération personne

    // Set la génération des enfants directs
    nbGen ++;
    parentsGen.push([]);
    // Si la personne a des enfants
    if (p.enfants.length != 0) {
        //Pour chaqun d'entre eux
        for (var enf of p.enfants) {
            enf = findById(list, enf);
            // Si il ne sont pas dans la liste
            if (!parentsGen[nbGen].includes(enf)) {
                parentsGen[nbGen].push(enf);
            }
        }
    }
    parentsGen[nbGen] = sortByDate(parentsGen[nbGen])
    // Tant que la dernière liste de parents n'est pas vide
    while (parentsGen[nbGen].length != 0) {
        // Crée une liste dans parentsGen et passe à la génération d'après
        nbGen++;
        parentsGen.push([]);
        // Pour chaque personne de la liste
        for (var par of parentsGen[nbGen - 1]) {
            // Pour chaque parent de la personne
            var subGen = [];
            for (var enf of par.enfants) {
                var enf = findById(list, enf);
                // Si le parent n'est pas dans la liste
                if (!subGen.includes(enf)) {
                    subGen.push(enf);
                }
            }
            subGen = sortByDate(subGen);
            for (var s of subGen) {
                parentsGen[nbGen].push(s);
            }
        }
    }

    // Enlève la dernière liste (elle est normallement vide)
    parentsGen.pop();
    return parentsGen;
}


//
// ---------- Exportation des routes --------------------------------------------------------------
//


module.exports = router;