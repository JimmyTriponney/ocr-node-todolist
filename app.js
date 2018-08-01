var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ent = require('ent');

var todo = [];

//Fonction permettant de retrouver une tâche via son id
//Si l'id est trouvé la fonction retourne l'index
//Sinon elle retourn -1
var findId = id => {
        for(i = 0; i < todo.length; i++){
            if( todo[i]['id'] == id ){
                return i;
            }
        }
        return -1;
    };

//Fonction permettant de créer un id qui n'existe pas dans le tableau des tâches
var createId = () => {
        var newId = -1, i = 0;
        while( newId < 0 ){
            if( findId(i) < 0 ) return i;
            i++;
        }
        return newId;
    };

app
    //Route "/" GET
    .get('/', (req, res) => {
        res.render('todo.html.twig', {todo: todo});//Rendu de la template twig avec le tableau des tâches
    })
;

//Gestion des événements socket
io.on('connection', socket => {
    
    //Quand un nouvel utilisateur se connecte
    socket.on('new_user', name => {
        socket.user = ent.encode(name);//Ajout du nom d'utilisateur dans la session socket
    });

    //Ajout d'une tâche et envoi aux clients
    socket.on('new_item', item => {
        var newItem = {user: socket.user, item: ent.encode(item), id: createId()};//Création de la nouvelle tâche
        todo.push(newItem);//Ajout au tableau
        socket.broadcast.emit('new_item', newItem);//Envoi à tous les clients
        socket.emit('new_item', newItem);//Envoi au client émetteur
    });

    //Suppression d'une tâche dans le tableau et envoi aux clients de l'id
    socket.on('trash', id => {
        var index = findId(id);//Recherche de l'index dans le tableau via l'id
        if( index > -1 ){//Si l'id exist
            todo.splice( index, 1);//Suppression de la tâche dans le tableau via son index
            socket.broadcast.emit('trash', id);//Envoi de l'information aux clients
            socket.emit('trash', id);//Envoi de l'information à lémetteur de l'action
        }
    });
});

http.listen(8080);//Mise en place de l'écoute du serveur sur le port 8080