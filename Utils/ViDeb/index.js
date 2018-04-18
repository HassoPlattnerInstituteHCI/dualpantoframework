var   express     = require('express'),
      http        = require('http'),
      fs          = require('fs'),
      path        = require('path'),
      WebSocketServer = require('websocket').server,
      Framework   = require('../../Framework.js');
      connections = new Set();

const server = http.createServer((request, response) => {
    let filePath = __dirname+((request.url == '/') ? '/index.html' :('/static'+request.url));
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
wsServer.on('request', (request) => {
    var connection = request.accept();
    connections.add(connection);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', (message) => {
        console.log(message);
    });
    connection.on('close', (reasonCode, description) => {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        connections.delete(connection);
    });
    for(const device of Framework.getDevices()) {
        device.on('handleMoved', (i, p) => {
            const payload = {
                type: "handleMoved",
                board: "your_serial_board",
                id: i,
                pos:{
                    x: p.x,
                    y: p.y,
                    r: p.r
                }
            };
            for(connetion of connections) {
                connection.sendUTF(JSON.stringify(payload));
            }
        });
        device.on('moveHandleTo', (i, p) => {
            const payload = {
                type: "moveHandleTo",
                id: i,
                pos:{
                    x: p.x,
                    y: p.y,
                    r: p.r
                }
            };
            for(connetion of connections) {
                connection.sendUTF(JSON.stringify(payload));
            }
        })
    }
});
