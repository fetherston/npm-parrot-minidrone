const MiniDroneBtAdapter = require('./MiniDroneBtAdapter');

/**
 * Drone Class
 *
 * Exposes an API for issuing commands and interfacing
 * with the network adapter.
 * @author Christopher Fetherston <chris@cfetherston.com>
 */
class Drone {
    /**
     * Instantiates a new instance of the Drone class
     *
     * @param {Object} options Configuration options object
     * @param {Integer} options.updateMS Frequency of the flight params event loop in ms, default 100ms
     * @param {Boolean} options.autoconnect Connect immediately on instantiation, default false
     * @return {Drone} A new instance of the Drone class
     */
    constructor(options) {
        const defaults = {
            updateMS: 100,
            autoconnect: false,
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

        if (this.options.autoconnect) {
            this.connect();
        }
    }

    /**
     * Sets the drone's roll, pitch, yaw and altitude
     *
     * @param {Object} flightParams object, all object keys are optional to allow partial updates
     * @param {Integer} flightParams.roll The roll value of the drone -100 to 100(optional)
     * @param {Integer} flightParams.pitch The pitch value of the drone -100 to 100 (optional)
     * @param {Integer} flightParams.yaw The yaw value -100 to 100 (optional)
     * @param {Integer} flightParams.altitude Increase or decrease the altitude (overall rotor RPM) -100 to 100 (optional)
     * @return {undefined}
     */
    setFlightParams(flightParams) {
        this.flightParams = Object.assign({}, this.flightParams, flightParams);
    }

    /**
     * If the drone is in a flight status that is considered flying
     * @return {Boolean} If the drone is flying
     */
    isFlying() {
        if (!this.network) {
            return false;
        }
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
     * @return {undefined}
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

    /**
     * Preform the drone's animation routines
     * @param  {String} animation one of the following animation methods:
     *                  flipFront, flipBack, flipRight, flipLeft
     * @return {undefined}
     */
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
        this.network = new MiniDroneBtAdapter();
    }

    /**
     * The event loop that updates the drone's flight params every X ms
     * @return {undefined}
     */
    eventLoop() {
        if (!this.network || !this.network.connected) {
            return;
        }
        this.network.writeFlightParams(this.flightParams);
    }

    /**
     * Returns the battery level of the drone
     * @return {integer} The battery level %
     */
    getBatteryLevel() {
        return this.network.batteryLevel;
    }
}

module.exports = Drone;
