const keypress = require('keypress');
const Drone = require('./../../lib/Drone');

const drone = new Drone({
    autoconnect: true,
});
let timeout = null;
keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', (ch, key) => {
    const keyName = key && key.name ? key.name : false;
    const inputSensitivity = 70;
    if (!keyName) {
        return;
    }
    if (timeout) {
        clearTimeout(timeout);
        timeout = null;
    }
    const flightParams = {
        yaw: 0,
        pitch: 0,
        roll: 0,
        altitude: 0,
    };

    switch (keyName) {
    case 'up':
        flightParams.pitch = inputSensitivity;
        break;
    case 'down':
        flightParams.pitch = -inputSensitivity;
        break;
    case 'left':
        flightParams.roll = -inputSensitivity;
        break;
    case 'right':
        flightParams.roll = inputSensitivity;
        break;
    case 'w':
        flightParams.altitude = inputSensitivity;
        break;
    case 's':
        flightParams.altitude = -inputSensitivity;
        break;
    case 'a':
        flightParams.yaw = -inputSensitivity;
        break;
    case 'd':
        flightParams.yaw = inputSensitivity;
        break;
    case 't':
        drone.takeoffOrLand();
        break;
    case 'f':
        drone.trim();
        break;
    case 'escape':
        drone.emergency();
        break;
    case 'c':
        process.exit();
        break;
    default:
        break;
    }
    drone.setFlightParams(flightParams);
    timeout = setTimeout(() => {
        drone.setFlightParams({
            yaw: 0,
            pitch: 0,
            roll: 0,
            altitude: 0,
        });
    }, 400);
});

process.stdin.setRawMode(true);
process.stdin.resume();
