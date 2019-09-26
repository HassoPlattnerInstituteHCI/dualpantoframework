/* eslint-disable */
var os = require('os'),
    fs = require('fs'),
    spawn = require('child_process').spawn;


var platform = os.platform();
console.log(platform);
if(platform === 'darwin') {
    var child = spawn('xcodebuild', {
    cwd: './utils/voiceCommand/src/osx/voice-command/'
    });
}
else if (platform == "win32") {
    var msbuild = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/msbuild.exe';
    var child = spawn(msbuild, ['/p:Configuration=Release', 'voice-command.csproj', '/p:Platform=AnyCPU'], {
    cwd: './utils/voiceCommand/src/win/voice-command/'
    });
    child.stdout.on('data', function (data) { console.log('' + data); });
    child.stderr.on('data', function (data) { console.log('' + data); });
}
else {
    console.log('Platform ' + platform + ' is not supported yet.');
}
if(child){
    child.on('close', function(code) {
      if (code !== 0) {
        console.log('Build process exited with code ' + code);
        process.exit(1);
      }
    });
}