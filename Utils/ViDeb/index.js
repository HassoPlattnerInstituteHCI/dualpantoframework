var   express     = require('express'),
      http    = require('http'),
      fs = require('fs'),
      WebSocketServer = require('websocket').server,
      connections = new Set();
      path = require('path');

// var app = express();
// app.use(express.static(path.join(__dirname+'/static')));

// app.get('/', function(req,res){
//     res.sendFile(__dirname + '/index.html');
// });

// app.listen(8080, function(){
//     console.log('listening on *:8080');
// });
const server = http.createServer((request, response) => {
    let filePath = __dirname+((request.url == '/') ? '/index.html' :('/static'+request.url));
    // let filepath = __dirname+'/index.html';
    // let filePath = __dirname + '/static'
    const extname = path.extname(filePath);
    let contentType = 'text/plain';
    switch(extname) {
        case '.html':
            contentType = 'text/html';
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }

    fs.readFile(filePath, function(error, content) {
        if(error) {
            if(error.code == 'ENOENT')
                response.writeHead(404);
            else
                response.writeHead(500);
        } else {
            response.writeHead(200, {
                'Content-Type': contentType
            });
            response.write(content);

        }
        response.end();
    });
}).on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
}).listen(8080);


wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});
wsServer.on('request', function(request) {
    var connection = request.accept();
    connections.add(connection);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        // console.log('< '+message.utf8Data);
        // proc.stdin.write(message.utf8Data);
        message = JSON.parse(message.utf8Data);
        const data = new Buffer(9);
        for(let i = 0; i < 2; ++i) {
            data[0] = i;
            data.writeInt32LE(message.angles[i], 1);
            data.writeInt32LE(message.forces[i], 5);
            serialSend(data);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        connections.delete(connection);
    });
});
