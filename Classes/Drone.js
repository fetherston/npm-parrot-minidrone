const MiniDroneBtAdaptor = require('./MiniDroneBtAdaptor');

/**
 * Drone Class
 *
 * Exposes an API for issuing commands and stores
 * the flight status of the drone
 */
class Drone {
    constructor(options) {
        const defaults = {
            updateMS: 100,
        };
        this.flightParams = {
            roll: 0,
            pitch: 0,
            yaw: 0,
            altitude: 0,
        };
        this.options = Object.assign({}, defaults, options);
        this.network = null;

        // update loop, writes the flight params to the network every X ms
        this.eventInterval = setInterval(() => this.eventLoop(), this.options.updateMS);

        this.connect();
    }

    /**
     * Sets the drone's roll, pitch, yaw and altitude
     * @param {object} flightParams object containing roll, pitch, yaw or altitude to update
     */
    setFlightParams(flightParams) {
        this.flightParams = Object.assign({}, this.flightParams, flightParams);
    }

    isFlying() {
        const flightStatus = this.network.flightStatus;
        return flightStatus === 'hovering' ||
            flightStatus === 'flying' ||
            flightStatus === 'rolling' ||
            flightStatus === 'taking off';
    }

    /**
     * Toggle the drone's takeoff or land command
     * @return {undefined}
     */
    takeoffOrLand() {
        this.isFlying() ? this.land() : this.takeOff();
    }

    /**
     * Perform the drone's automated takeoff command
     * @return {undefined}
     */
    takeOff() {
        this.network.writeTakeoff();
    }

    /**
     * Perform the drone's automated land command
     * @return {undefined}
     */
    land() {
        this.network.writeLand();
    }

    /**
     * Perform the drone's trim command
     * @return {undefined}
     */
    trim() {
        this.network.writeTrim();
    }

    /**
     * Perform the drone's take a picture command
     * @return {[type]} [description]
     */
    takePicture() {
        this.network.writeTakePicture();
    }

    /**
     * Perform the drone's emergency landing, kills the rotors
     * @return {undefined}
     */
    emergency() {
        this.network.writeEmergency();
    }

    animate(animation) {
        this.network.writeAnimation(animation);
    }

    /**
     * Pairs with the drone as a BTLE peripheral
     * @return {undefined}
     */
    connect() {
        if (this.network) {
            return;
        }
        this.network = new MiniDroneBtAdaptor();
    }

    /**
     * The event loop that updates the drone's flight params every X ms
     * @return {[type]} [description]
     */
    eventLoop() {
        if (!this.network.connected) {
            return;
        }
        this.network.writeFlightParams(this.flightParams);
    }

    getBatteryLevel() {
        return this.network.batteryLevel;
    }
}

module.exports = Drone;
