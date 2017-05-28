![Travis Status](https://travis-ci.org/fetherston/npm-parrot-minidrone.svg?branch=master)
# Fly Parrot MiniDrones with Node
This package wraps the BlueTooth low energy library Noble to expose a simple API for flying [Parrot MiniDrones](https://www.parrot.com/us/minidrones). That includes the Rolling Spider, Airborne Cargo, Night and Hydrofoil models. Unlike other libraries that are designed to run stepped commands, this library is designed to allow continuous control through any input device.

### [View the documentation](http://fetherston.github.io/npm-parrot-minidrone)

## Dependencies
- Noble requires Xcode. Download and install the latest version from Apple's developer network
- Node >= 6.0.0

## Get Started in 60 Seconds

1. Grab the module `npm install parrot-minidrone`
1. Create `index.js` with the below code
1. Run the script `node index.js`

```
const Drone = require('parrot-minidrone');
const drone = new Drone({
    autoconnect: true,
});

drone.on('connected', () => drone.takeOff());
drone.on('flightStatusChange', (status) => {
    if (status === 'hovering') {
        drone.land();
        process.exit();
    }
});
```

## Examples
In the examples folder of this library are a few scripts using the API to fly drones with various input devices.

### Dualshock PlayStation Controller
Follow these directions from the root of the project to fly with a PS3/4 controller

1. Turn on the drone
1. Plug in the controller via USB or connect to your computer via Bluetooth
1. Run `node examples/dualshock-ps3-controller/drone.js`
1. Wait to see the drone connected message in the console output

#### Control Layout
*Button* | Function
--- | ---
**Right Analog Stick** | Altitude, yaw
**Left Analog Stick** | Roll, pitch
**Square** | Flat-trim
**Triangle** | Toggle takeoff & land
**Circle** | Emergency landing
**X** | Take a picture
**L1** | Left flip
**R1** | Right Flip
**L2** | Front Flip
**R2** | Back Flip

### Keyboard
To fly with the keyboard follow the below instructions.

1. Turn on the drone
1. Run `node examples/keyboard/drone.js`
1. Wait to see the drone connected message in the console output

#### Control Layout
*Key* | Function
--- | ---
**Arrow Up** | Pitch +
**Arrow Down** | Pitch -
**Left Arrow** | Roll left
**Left Arrow** | Roll right
**w** | Altitude +
**s** | Altitude +
**a** | Yaw left
**d** | Yaw right
**t** | Toggle takeoff & land
**f** | Flattrim
**Escape** | Emergency land

## Tests
To run the test runner execute `npm test`.

## Changelog

### 1.1.0
- Added support for Mambo, Blaze and New Z minidrones
- Added support for setting max tilt, altitude, vertical speed, rotation speed and defining a drone type to connect to

### 1.0.3
- Event battery change event
- Fix issue with an error being thrown during connection on some Bluetooth devices

### 1.0.2
- Documentation
- Unit tests
- Flips interface

![Travis Status](https://travis-ci.org/fetherston/npm-parrot-minidrone.svg?branch=master)
