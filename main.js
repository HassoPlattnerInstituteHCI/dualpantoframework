const child_process = require('child_process'),
      fs = require('fs'),
      path = require('path'),
      SerialPort = require('serialport'),
      Buffer = require('buffer').Buffer,
      WebSocketServer = require('websocket').server,
      http = require('http'),
      connections = new Set();

/*const proc = child_process.spawn('gzdoom.app/Contents/MacOS/gzdoom');

proc.stdout.on('data', (data) => {
    data = data.toString();
    for(const line of data.split('\n')) {
        if(line.length == 0 || line[0] != '{')
            continue;
        console.log('> '+line);
        for(const connection of connections)
            connection.send(line);
    }
});

proc.stderr.on('error', (err) => {
    console.log(`error: ${err}`);
});

proc.on('exit', (code) => {
    console.log(`Child exited with code ${code}`);
    process.exit(code);
});*/


const serial = child_process.spawn('./serial', [process.argv[2]]);

function serialSend(data) {
    let packet = '';
    for(let i = 0; i < data.length; ++i) {
        const hex = data[i].toString(16);
        if(hex.length == 1)
            packet += '0';
        packet += hex+' ';
    }
    serial.stdin.write(packet+'\n');
}

function serialRecv(data) {
    const angles = [];
    for(let i = 0; i < 6; ++i)
        angles[i] = data.readFloatLE(i*4);
    const packet = JSON.stringify({'angles': angles});
    for(const connection of connections)
        connection.send(packet);
}

let partialPacket;
serial.stdout.on('data', (data) => {
    const packets = data.toString().split('\n');
    if(partialPacket)
        packets[0] = partialPacket+packets[0];

    partialPacket = (packets.length > 0) ? packets.pop() : undefined;
    if(partialPacket.length == 0)
        partialPacket = undefined;

    for(let data of packets) {
        if(data.length == 0)
            return;
        data = data.split(' ');
        const bytes = [];
        for(let i = 0; i < data.length-1; ++i)
            bytes.push(parseInt(data[i], 16));
        data = new Buffer(bytes);
        serialRecv(data);
    }
});

serial.stderr.on('error', (err) => {
    console.log(`error: ${err}`);
});

serial.on('exit', (code) => {
    console.log(`Serial exited with code ${code}`);
    process.exit(code);
});



const server = http.createServer((request, response) => {
    let filePath = './' + ((request.url == '/') ? '/index.html' : request.url);

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

const wsServer = new WebSocketServer({'httpServer': server});
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
            data.writeFloatLE(message.angles[i], 1);
            serialSend(data);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        connections.delete(connection);
    });
});
