const MiniDroneBtAdapter = require('./MiniDroneBtAdapter');
const EventEmitter = require('events');

/**
 * Drone Class
 *
 * Exposes an API for issuing commands and interfacing
 * with the network adapter.
 * @author Christopher Fetherston <chris@cfetherston.com>
 *
 * @fires Drone#connected
 * @fires Drone#batteryStatusChange
 * @fires Drone#flightStatusChange
 * @fires Drone#batteryStatusChange
 * @fires Drone#maxAltitudeChange
 * @fires Drone#maxTiltChange
 * @fires Drone#maxVerticalSpeedChange
 * @fires Drone#maxRotationSpeedChange
 */
class Drone extends EventEmitter {
    /**
     * Instantiates a new instance of the Drone class
     *
     * @param {Object} options Configuration options object
     * @param {Integer} options.updateMS Frequency of the flight params event loop in ms, default 100ms
     * @param {Boolean} options.autoconnect Connect immediately on instantiation, default false
     * @param {Integer} options.maxAltitude The max height in meters the drone can reach (2-10)
     * @param {Integer} options.maxTilt The max tilt the drone can achieve from 0-100 (100 being the max 20° inclination the drone firmware allows)
     * @param {Float} options.maxVerticalSpeed The max vertical speed in meters/s the drone can reach (0.5 - 2)
     * @param {Integer} options.maxRotationSpeed The rotation speed in °/s the drone can reach (50 - 1000)
     * @param {String} options.droneFilter The name of the drone to restrict connection to
     * @return {Drone} A new instance of the Drone class
     */
    constructor(options) {
        super();
        const defaults = {
            updateMS: 100,
            autoconnect: false,
            maxAltitude: 2,
            maxTilt: 40,
            maxVerticalSpeed: 0.5,
            maxRotationSpeed: 150,
            droneFilter: '',
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

        this.on('connected', this.onConnected);
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
     * Sets the drone's Max Altitude
     *
     * @param {Integer} altitude Increase or decrease the max altitude 0.5 to 10
     * @return {undefined}
     */
    setMaxAltitude(altitude) {
        this.options.maxAltitude = altitude;
        this.network.writeMaxAltitude(this.options.maxAltitude);
    }

    /**
     * Sets the drone's Max Tilt
     *
     * @param {Integer} tilt set max tilt angle 0-100 (0 = 5° - 100 = 25°)
     * @return {undefined}
     */
    setMaxTilt(tilt) {
        this.options.maxTilt = tilt;
        this.network.writeMaxTilt(this.options.maxTilt);
    }

    /**
     * Sets the drone's MaxVerticalSpeed
     *
     * @param {Integer} speed set max vertical speed in m/s (0.5m/s  to 2m/s)
     * @return {undefined}
     */
    setMaxVerticalSpeed(speed) {
        this.options.maxVerticalSpeed = speed;
        this.network.writeMaxVerticalSpeed(this.options.maxVerticalSpeed);
    }

    /**
     * Sets the drone's MaxRotationSpeed
     *
     * @param {Integer} speed Increase or decrease rotation speed (yaw) in °/sec 0-1000 (50°/s - 360°/s)
     * @return {undefined}
     */
    setMaxRotationSpeed(speed) {
        this.options.maxRotationSpeed = speed;
        this.network.writeMaxRotationSpeed(this.options.maxRotationSpeed);
    }

    /**
     * Sets the filter to connect on a specific drone based on its network name
     *
     * @param {String} name The name of the drone to connect to
     * @return {undefined}
     */
    setDroneFilter(name) {
        this.options.droneFilter = name;
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
        this.network = new MiniDroneBtAdapter({
            droneFilter: this.options.droneFilter,
        });

        // TODO: do not love the events stuff :/

        /**
         * Fires when the Drone successfully connected over Bluetooth
         *
         * @event Drone#connected
         * @type {object}
         */
        this.network.on('connected', (...args) => this.emit('connected', ...args));

        /**
         * Fires when a flight param command is written over the Bluetooth network
         *
         * @event Drone#flightParamChange
         * @type {object}
         */
        this.network.on('flightParamChange', (...args) => this.emit('flightParamChange', ...args));

        /**
         * Fires when the drone's flight status has changed
         *
         * @event Drone#flightStatusChange
         * @type {object}
         */
        this.network.on('flightStatusChange', (...args) => this.emit('flightStatusChange', ...args));

        /**
         * Fires when the drone's battery status has changed
         *
         * @event Drone#batteryStatusChange
         * @type {object}
         */
        this.network.on('batteryStatusChange', (...args) => this.emit('batteryStatusChange', ...args));

        /**
         * Fires when the drone's max altitude  has changed
         *
         * @event Drone#maxAltitudeChange
         * @type {object}
         */
        this.network.on('maxAltitudeChange', (...args) => this.emit('maxAltitudeChange', ...args));

        /**
         * Fires when the drone's max tilt  has changed
         *
         * @event Drone#maxTiltChange
         * @type {object}
         */
        this.network.on('maxTiltChange', (...args) => this.emit('maxTiltChange', ...args));

        /**
         * Fires when the drone's max vertical speed has changed
         *
         * @event Drone#maxVerticalSpeed
         * @type {object}
         */
        this.network.on('maxVerticalSpeedChange', (...args) => this.emit('maxVerticalSpeedChange', ...args));

        /**
         * Fires when the drone's max rotation speed has changed
         *
         * @event Drone#maxRotationSpeed
         * @type {object}
         */
        this.network.on('maxRotationSpeedChange', (...args) => this.emit('maxRotationSpeedChange', ...args));

        /**
         * Fires when Rssi update is Received
         *
         */
        this.network.on('rssiUpdate', (...args) => this.emit('rssiUpdate', ...args));
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

    /**
     * Gets Rssi value
     * @return {interger} Rssi value
     */
    getRssi() {
        this.network.updateRssi();
    }

    /**
     * Preforms some basic setup immediately after the drone is connected
     * @return {undefined}
     */
    onConnected() {
        this.setMaxAltitude(this.options.maxAltitude);
        this.setMaxTilt(this.options.maxTilt);
        this.setMaxVerticalSpeed(this.options.maxVerticalSpeed);
        this.setMaxRotationSpeed(this.options.maxRotationSpeed);
    }
}

module.exports = Drone;
