const Controller = require('./Controller');
const Drone = require('./../../lib/Drone');

const drone = new Drone({
    autoconnect: true,
});

const controller = new Controller({
    onStartPress: drone.connect.bind(drone),
    onTrianglePress: drone.takeoffOrLand.bind(drone),
    onSquarePress: drone.trim.bind(drone),
    onCirclePress: drone.emergency.bind(drone),
    onXPress: drone.takePicture.bind(drone),
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
    onL1Press: () => {
        drone.animate('flipLeft');
    },
    onL2Press: () => {
        drone.animate('flipFront');
    },
    onR1Press: () => {
        drone.animate('flipRight');
    },
    onR2Press: () => {
        drone.animate('flipBack');
    },
});
