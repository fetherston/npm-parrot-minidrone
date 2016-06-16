# Node.js script to fly Parrot MiniDrones with a PS3 DualShock Controller
This script wraps the Noble BLE JS library and the PS3 & PS4 DualShock library so that you can fly a Parrot MiniDrone with a PS3 controller, Bluetooth and a Node.js client.

Why? I didn't want to jailbreak an iOS device or root an Android phone to use a PS3 controller and flying these little drones with analog sticks is _way_ better than flying it with a smart phone.

Known to work with the Airborne Cargo, Airborne Night and the Rolling Spider.

Grabs a bunch of inspiration from [Voodootikigod's rolling spider library](https://github.com/voodootikigod/node-rolling-spider).

## How to use

1. Meet the [prerequisites for Noble](https://github.com/sandeepmistry/noble#prerequisites).
1. Install dependencies `npm install`
1. Plug in the PlayStation controller via USB
1. Press the PS button on the controller
1. Turn the drone on
1. Run the script `node drone.js`
1. Press start on the PlayStation controller

## Control Layout
*Button* | Function
--- | ---
**Right Analog Stick** | Altitude, yaw
**Left Analog Stick** | Roll, pitch
**Square** | Flattrim
**Triangle** | Toggle takeoff & land
**Circle** | Emergency landing

## Known issues

- [ ] Occasionally it won't takeoff after landing