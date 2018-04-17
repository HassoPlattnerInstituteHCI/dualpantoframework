var   express     = require('express'),
      http    = require('http').Server(app),
      socket  = require('socket.io'),
      path = require('path');

var app = express();
app.use(express.static(path.join(__dirname+'/static')));

app.get('/', function(req,res){
    res.sendFile(__dirname + '/index.html');
});

app.listen(8080, function(){
    console.log('listening on *:8080');
});