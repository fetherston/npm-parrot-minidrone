var Controller = require('./Classes/Controller');
var Drone = require('./Classes/Drone');

var drone = new Drone();
var controller = new Controller({
    onRightAnalogMove: (data) => {
        drone.setFlightParams({
            roll: data.x,
            pitch: data.y,
        });
    },
    onLeftAnalogMove: (data) => {
        drone.setFlightParams({
            yaw: data.x,
            altitude: data.y,
        });
    },
    onStartPress: drone.connect.bind(drone),
    onTrianglePress: drone.takeoffOrLand.bind(drone),
    onSquarePress: drone.trim.bind(drone),
    onCirclePress: drone.emergency.bind(drone),
});
