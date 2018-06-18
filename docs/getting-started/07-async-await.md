# [Getting Started](README.md) - Step 7
## Async and await

Let's have a look at how to write a simple "city map" that tells you abaout hotels.

First we will activate voice commands:
```js
const broker = new Broker();

// this sets the commands and starts listening
broker.setCommands(['Hotels']);
```

Now let's add some initial communication:
```js
broker.on('device', async device => {
    await device.speakText('Sie sind aktuell hier.');
    await device.meHandle.moveTo(new Vector(-50, -75));

    // wait 500 milliseconds (0.5 seconds)
    await delay(500);
    await device.speakText('Lass mich dir die gegend zeigen.');
    await device.itHandle.moveTo(new Vector(-50, -75));
});
```

But where does the `delay` function come from? We need to include it from the framework, edit your require line at the beginning:
```js
const {Broker, Vector, delay} = require('dualpantoframework');
```

Now we can tell the user that voice interaction is available and allow free movement of the it handle:
```js
broker.on('device', async device => {
    // ...

    await device.speakText('Du kannst Hotels sagen und ich zeige dir Hotelstandorte.');
    await device.meHandle.unblock();
});
```

We want to detect when a handle moves close to a hotel:
```js
broker.on('device', async device => {
    // ...

    let lastNearbyHotel = null;
    device.meHandle.on('positionChanged', async position => {
        const nearbyHotel = getNearbyHotel(position);
        if(lastNearbyHotel !== nearbyHotel) {
            lastNearbyHotel = nearbyHotel;
            await showHotel(device, nearbyHotel);
        }
    });
});
```

But we need the `getNearbyHotel` and `showHotel` function. Place them above the `broker.on('device', ...` statement:
```js
const hotels = [{
    name: 'Hotel Adlon',
    position: new Vector(40, -40),
}, {
    name: 'Hotel Air B&B',
    position: new Vector(60, -60),
}];

const getNearbyHotel = position => {
    for(const hotel of hotels) {
        if(position.diff(hotel.position).length < 10) {
            // return the hotel
            return hotel;
        }
    }

    // no nearby hotel found
    return null;
};

const showHotel = async (device, hotel) => {
    // wait for two actions at the same time
    // aka. move and speak at the same time
    await Promise.all([
        device.speakText(`Das ist ${hotel.name}.`),
        device.itHandle.moveTo(hotel.position),
    ]);
};
```

The last step is to react to the voice command:
```js
broker.on('device', async device => {
    // ...

    device.onKeyword('Hotels', async () => {
        for(const hotel of hotels) {
            await showHotel(device, hotel);
            await delay(500);
        }
    });
});
```

### How does this `async` and `await` work?
Whenever something takes some time before it is done (e.g. wait for a `delay`, say someting or move to a position) you want to tell javascript that you want to wait for it with the `await` keyword:
```js
await device.itHandle.moveTo(new Vector(50, -50));
```

But you can not just use `await`. You must also tell javascript where you want to use await. You can do this, by adding the `async` keyword to the function in which you want to use `async`:
```js
device.meHandle.on('positionChanged', async position => {
    await device.itHandle.moveTo(position);
});
```

### The complete file
```js
'use strict';

const {Broker, Vector, delay} = require('dualpantoframework');

const broker = new Broker();

const hotels = [{
    name: 'Hotel Adlon',
    position: new Vector(40, -40),
}, {
    name: 'Hotel Air B&B',
    position: new Vector(60, -60),
}];

const getNearbyHotel = position => {
    for(const hotel of hotels) {
        if(position.diff(hotel.position).length < 10) {
            // return the hotel
            return hotel;
        }
    }

    // no nearby hotel found
    return null;
};

const showHotel = async (device, hotel) => {
    // wait for two actions at the same time
    // aka. move and speak at the same time
    await Promise.all([
        device.speakText(`Das ist ${hotel.name}.`),
        device.itHandle.moveTo(hotel.position),
    ]);
};

// this sets the commands and starts listening
broker.setCommands(['Hotels']);

broker.on('device', async device => {
    await device.speakText('Sie sind aktuell hier.');
    await device.meHandle.moveTo(new Vector(-50, -75));

    // wait 500 milliseconds (0.5 seconds)
    await delay(500);
    await device.speakText('Lass mich dir die gegend zeigen.');
    await device.itHandle.moveTo(new Vector(-50, -75));

    await device.speakText('Du kannst Hotels sagen und ich zeige dir Hotelstandorte.');
    await device.meHandle.unblock();

    let lastNearbyHotel = null;
    device.meHandle.on('positionChanged', async position => {
        const nearbyHotel = getNearbyHotel(position);
        if(lastNearbyHotel !== nearbyHotel) {
            lastNearbyHotel = nearbyHotel;
            await showHotel(device, nearbyHotel);
        }
    });

    device.onKeyword('Hotels', async () => {
        for(const hotel of hotels) {
            await showHotel(device, hotel);
            await delay(500);
        }
    });
});
```

Go back: [Home](README.md)
