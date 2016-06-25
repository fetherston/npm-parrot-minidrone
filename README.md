# Fly Parrot MiniDrones with Node
This package wraps the BlueTooth low energy library Noble to expose a simple API for flying Parrot MiniDrones. That includes the Rolling Spider, Airborne Cargo, Night and Hydrofoil models.

## Dependencies
- Noble requires Xcode. Download and install the latest version from Apple's developer network
- Node >= 6.0.0

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
**Square** | Flattrim
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
