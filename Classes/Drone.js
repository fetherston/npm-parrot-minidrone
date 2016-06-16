var MiniDroneBtAdaptor =  require('./MiniDroneBtAdaptor');

/**
 * Drone Class
 *
 * Exposes an API for issuing commands and stores
 * the flight status of the drone
 */
class Drone {
    constructor(options) {
        let defaults = {
            updateMS: 100,
        };
        this.flightParams = {
            roll: 0,
            pitch: 0,
            yaw: 0,
            altitude: 0,
        };
        this.options = Object.assign({}, defaults, options);

        this.connected = false;
        this.flying = false;
        this.network = null;

        // update loop, writes the flight params to the network every X ms
        this.eventInterval = setInterval(() => this.eventLoop(), this.options.updateMS);
    }

    /**
     * Sets the drone's roll, pitch, yaw and altitude
     * @param {object} flightParams object containing roll, pitch, yaw or altitude to update
     */
    setFlightParams(flightParams) {
        this.flightParams = Object.assign({}, this.flightParams, flightParams);
    }

    /**
     * Toggle the drone's takeoff or land command
     * @return {undefined}
     */
    takeoffOrLand() {
        this.flying ? this.land() : this.takeOff();
    }

    /**
     * Preform the drone's automated takeoff command
     * @return {undefined}
     */
    takeOff() {
        this.network.writeTakeoff();
        this.flying = true
    }

    /**
     * Preform the drone's automated land command
     * @return {undefined}
     */
    land() {
        this.network.writeLand();
        this.flying = false
    }

    /**
     * Preform the drone's trim command
     * @return {undefined}
     */
    trim() {
        this.network.writeTrim();
    }

    /**
     * Preform the drone's emergency landing, kills the rotors
     * @return {undefined}
     */
    emergency() {
        this.network.writeEmergency();
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
        if (!this.flying || !this.network) {
            return;
        }
        this.network.writeFlightParams(this.flightParams);
    }

    getBatteryLevel() {
        return this.network.batteryLevel;
    }
}

module.exports = Drone;
