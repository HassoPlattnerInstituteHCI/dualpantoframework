'use strict';

const Framework = require('./../../');
const {Vector} = Framework;

function generateRoom(
    path,
    leftToBottom,
    startX,
    startY,
    wallLength,
    steps)
{
    if(steps < 1) return;

    let l3 = wallLength / 3;
    let l4 = wallLength / 4;

    if(leftToBottom)
    {
        path.push(new Vector(startX, startY)); // next to entrance
        path.push(new Vector(startX, startY - l4)); // corner bottom left
        path.push(new Vector(startX + l3, startY - l4)); // next to exit

        generateRoom(path, !leftToBottom, startX + l3, startY - l4 - l3, l3 * 2, steps-1);

        path.push(new Vector(startX + l3 * 2, startY - l4)); // next to exit
        path.push(new Vector(startX + wallLength, startY - l4)); // corner bottom right
        path.push(new Vector(startX + wallLength, startY - l4 + wallLength)); // corner top right
        path.push(new Vector(startX, startY - l4 + wallLength)); // corner top left
        path.push(new Vector(startX, startY + 2 * l4)); // next to entrance
    }
    else
    {
        path.push(new Vector(startX, startY)); // next to entrance
        path.push(new Vector(startX - l4, startY)); // corner top left
        path.push(new Vector(startX - l4, startY - wallLength)); // corner bottom left
        path.push(new Vector(startX - l4 + wallLength, startY - wallLength)); // corner bottom right
        path.push(new Vector(startX - l4 + wallLength, startY - wallLength + l3)); // next to exit

        generateRoom(path, !leftToBottom, startX - l4 + wallLength + l3, startY - wallLength + l3, l3 * 2, steps-1);

        path.push(new Vector(startX - l4 + wallLength, startY - l3)); // next to exit
        path.push(new Vector(startX - l4 + wallLength, startY)); // corner top right
        path.push(new Vector(startX + 2 * l4, startY)); // next to entrance
    }
    
}

function generateRooms(path)
{
    generateRoom(path, false, -30, -80, 50, 4);
    console.log("poligon");
    
}

Framework.on('devicesChanged', function(devices, attached, detached) {
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for (const device of devices) {
    if (device) {
      device.on('handleMoved', function(index, position) {
        console.log('index: ', index, ' position: ', position);
      });
      Framework.run_script([
            () => device.movePantoTo(0, new Vector(-20, -100, NaN), 30),
            //() => device.moveHandleTo(0, new Vector(-20, -100, NaN)),
            () => {
                return new Promise(resolve => {
                    setTimeout( () => {
                        let path = [];
                        generateRooms(path);
                        let minX = 10000;
                        let maxX = -10000;
                        let minY = 10000;
                        let maxY = -10000;
                        console.log("(%s,%s) (%s,%s)", minX.toFixed(1), minY.toFixed(1), maxX.toFixed(1), maxY.toFixed(1));
                        
                        path = path.slice(0, 31);
                        console.log(path);
                        let path2 = [new Vector(-50, -80), new Vector(50, -80)];
                        console.log(path2);
                        //path = path2;
                        
                        let out = "";
                        for(let p of path)
                        {
                            //console.log("%s|%s", p.x.toFixed(2), p.y.toFixed(2));
                            out += p.x.toFixed(2) + "|" +  p.y.toFixed(2) + " ";
                            //console.log(p);
                            minX = Math.min(minX, p.x);
                            maxX = Math.max(maxX, p.x);
                            minY = Math.min(minY, p.y);
                            maxY = Math.max(maxY, p.y);
                            //p.r = 0;
                        }
                        console.log(out);
                
                        device.createObstacle(path);
                    }, 3000)
                });
            },/**/
      ]);
        // setTimeout(() => {
        //     let path = [];
        //     generateRooms(path);
        //     let minX = 10000;
        //     let maxX = -10000;
        //     let minY = 10000;
        //     let maxY = -10000;
        //     console.log("(%s,%s) (%s,%s)", minX.toFixed(1), minY.toFixed(1), maxX.toFixed(1), maxY.toFixed(1));
            
        //     path = path.slice(0, 31);
        //     console.log(path);
        //     let path2 = [new Vector(-50, -80), new Vector(50, -80)];
        //     console.log(path2);
        //     //path = path2;
            
        //     let out = "";
        //     for(let p of path)
        //     {
        //         //console.log("%s|%s", p.x.toFixed(2), p.y.toFixed(2));
        //         out += p.x.toFixed(2) + "|" +  p.y.toFixed(2) + " ";
        //         //console.log(p);
        //         minX = Math.min(minX, p.x);
        //         maxX = Math.max(maxX, p.x);
        //         minY = Math.min(minY, p.y);
        //         maxY = Math.max(maxY, p.y);
        //         //p.r = 0;
        //     }
        //     console.log(out);

        //     device.createObstacle(path);
        // }, 1000);
    }
  }
});
