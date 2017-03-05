const Logger = require('winston');
const EventEmitter = require('events');

// MiniDrone Command classes and class methods
// https://github.com/Parrot-Developers/libARCommands/blob/master/Xml/MiniDrone_commands.xml
const MD_CLASSES = {
    PILOTING: 0x00,
    SPEED_SETTINGS: 0x01,
    ANIMATION: 0x04,
    MEDIA_RECORD: 0x06,
    PILOTING_SETTINGS: 0x08,
    NAVIGATION_DATA_STATE: 0x18,
};
const MD_METHODS = {
    TRIM: 0x00,
    TAKEOFF: 0x01,
    LAND: 0x03,
    EMERGENCY: 0x04,
    PICTURE: 0x01,
    FLIP: 0x00,
    MAX_ALTITUDE: 0x00,
    MAX_TILT: 0x01,
    MAX_VERTICAL_SPEED: 0x00,
    MAX_ROTATION_SPEED: 0x01,
    DRONE_POSITION: 0x00,
};
const MD_DATA_TYPES = {
    ACK: 0x01,
    DATA: 0x02,
    LLD: 0x03,
    DATA_WITH_ACK: 0x04,
};

// BTLE Characteristic keys
const BATTERY_KEY = 'fb0f';
const FLIGHT_STATUS_KEY = 'fb0e';
const FLIGHT_PARAMS_KEY = 'fa0a';
const COMMAND_KEY = 'fa0b';
const EMERGENCY_KEY = 'fa0c';
// TODO: need all these?
const CHARACTERISTIC_MAP = [
    BATTERY_KEY, FLIGHT_STATUS_KEY, 'fb1b', 'fb1c', 'fd22', 'fd23', 'fd24', 'fd52', 'fd53', 'fd54',
];

// Drone IDs
const MANUFACTURER_SERIALS = ['4300cf1900090100', '4300cf1909090100', '4300cf1907090100'];
const DRONE_PREFIXES = ['RS_', 'Mars_', 'Travis_', 'Maclan_', 'Mambo_', 'Blaze_', 'NewZ_'];

const MD_DEVICE_TYPE = 0x02;

const FLIGHT_STATUSES = ['landed', 'taking off', 'hovering', 'flying',
                         'landing', 'emergency', 'rolling', 'initializing'];

/**
 * Network adapter between drone and Noble BTLE
 * Abstracts away all the characteristics, buffers
 * and steps bullshit.
 *
 * @author Christopher Fetherston <chris@cfetherston.com>
 */
class MiniDroneBtAdapter extends EventEmitter {
    /**
     * Instantiates a new instance of the MiniDroneBtAdapter class
     *
     * @param {Object} options Configuration options object
     * @param {String} options.droneFilter The name of the drone to restrict connection to
     */
    constructor(options) {
        super();
        const defaults = {
            droneFilter: '',
        };
        this.options = Object.assign({}, defaults, options);
        // noble is not a constructor
        this.noble = require('noble');
        this.connected = false;
        this.peripheral = null;
        this.characteristics = [];
        this.batteryLevel = 'Unknown';
        // Steps hold the command sequence, they increment with every new characteristic write
        // and should be reset once reaching 255
        this.steps = {};
        this.steps[FLIGHT_PARAMS_KEY] = 0;
        this.steps[COMMAND_KEY] = 0;
        this.steps[EMERGENCY_KEY] = 0;
        this.flightStatus = null;
        // flight param cache to only send values that have changed
        this.flightParams = {
            roll: 0,
            pitch: 0,
            yaw: 0,
            altitude: 0,
        };
        this.lastFpWrite = 0;

        // bind noble event handlers
        this.noble.on('stateChange', (state) => this.onNobleStateChange(state));
        this.noble.on('discover', (peripheral) => this.onPeripheralDiscovery(peripheral));

        Logger.info('Searching for drones...');
    }

    /**
     * Event handler for when noble broadcasts a state change
     * @param  {String} state a string describing noble's state
     * @return {undefined}
     */
    onNobleStateChange(state) {
        Logger.debug(`Noble state change ${state}`);
        if (state === 'poweredOn') {
            this.noble.startScanning();
        }
    }

    /**
     * Writes a buffer to a BTLE peripheral characteristic
     * Most convince methods in this class point to this method
     *
     * @param  {String} uuid   the characteristic's UUID
     * @param  {Buffer} buffer stream of binary data
     * @return {undefined}
     */
    write(uuid, buffer) {
        if (!this.characteristics.length) {
            Logger.warn('You must have bluetooth enabled and be connected to a drone before executing a command.');
            return;
        }

        // Sequence number can only be stored in one byte, so we must reset after 255
        if (this.steps[uuid] >= 255) {
            this.steps[uuid] = 0;
        }

        this.getCharacteristic(uuid).write(buffer, true);
    }

    /**
     * Creates a buffer with the common values needed to write to the drone
     * @param  {String} uuid The characteristic UUID
     * @param  {Array}  args The buffer arguments, usually the above command constants
     * @return {buffer}      A freshly created Buffer stream
     */
    createBuffer(uuid, args = []) {
        const buffArray = [MD_DATA_TYPES.DATA, ++this.steps[uuid] & 0xFF, MD_DEVICE_TYPE];
        return new Buffer(buffArray.concat(args));
    }

    /**
     * Writes the drones roll, pitch, yaw and altitude to the device
     * TODO: This could be smarter and cache values and only update when changed
     *
     * @param  {object} flightParams Object containing any roll, pitch, yaw and altitude
     * @return {undefined}
     */
    writeFlightParams(flightParams) {
        // this is an optimization to only write values that have changed
        if (flightParams.roll === this.flightParams.roll &&
            flightParams.pitch === this.flightParams.pitch &&
            flightParams.yaw === this.flightParams.yaw &&
            flightParams.altitude === this.flightParams.altitude &&
            Date.now() - this.lastFpWrite <= 300) {
            return;
        }

        const buffer = new Buffer(19);
        this.flightParams = flightParams;
        this.lastFpWrite = Date.now();

        buffer.fill(0);
        buffer.writeInt16LE(2, 0);
        buffer.writeInt16LE(++this.steps[FLIGHT_PARAMS_KEY], 1);
        buffer.writeInt16LE(2, 2);
        buffer.writeInt16LE(0, 3);
        buffer.writeInt16LE(2, 4);
        buffer.writeInt16LE(0, 5);
        buffer.writeInt16LE(1, 6); // roll and pitch bool
        buffer.writeInt16LE(this.flightParams.roll, 7);
        buffer.writeInt16LE(this.flightParams.pitch, 8);
        buffer.writeInt16LE(this.flightParams.yaw, 9);
        buffer.writeInt16LE(this.flightParams.altitude, 10);
        buffer.writeFloatLE(0, 11);

        this.write(FLIGHT_PARAMS_KEY, buffer);
        this.emit('flightParamChange', this.flightParams);
    }

    /**
     * Convenience method for writing the flat trim command
     * @return {undefined}
     */
    writeTrim() {
        const buffer = this.createBuffer(COMMAND_KEY, [MD_CLASSES.PILOTING, MD_METHODS.TRIM, 0x00]);
        this.write(COMMAND_KEY, buffer);
        Logger.info('Trim command called');
    }

    /**
     * Convenience method for writing the takeoff command
     * @return {undefined}
     */
    writeTakeoff() {
        const buffer = this.createBuffer(COMMAND_KEY, [MD_CLASSES.PILOTING, MD_METHODS.TAKEOFF, 0x00]);
        this.write(COMMAND_KEY, buffer);
        Logger.info('Takeoff command called');
    }

    /**
     * Convenience method for writing the land command
     * @return {undefined}
     */
    writeLand() {
        const buffer = this.createBuffer(COMMAND_KEY, [MD_CLASSES.PILOTING, MD_METHODS.LAND, 0x00]);
        this.write(COMMAND_KEY, buffer);
        Logger.info('Land command called');
    }

    /**
     * Convenience method for writing the emergency command
     * @return {undefined}
     */
    writeEmergency() {
        const buffer = this.createBuffer(EMERGENCY_KEY, [MD_CLASSES.PILOTING, MD_METHODS.EMERGENCY, 0x00]);
        this.write(EMERGENCY_KEY, buffer);
        Logger.info('Emergency command called');
    }

    /**
     * Convenience method for writing the media take a picture command
     * @return {undefined}
     */
    writeTakePicture() {
        const buffer = this.createBuffer(COMMAND_KEY, [MD_CLASSES.MEDIA_RECORD, MD_METHODS.PICTURE, 0x00]);
        this.write(COMMAND_KEY, buffer);
        Logger.info('Take picture command called');
    }

    /**
     * Convenience method for writing animation class methods
     * @param {String} animation The animation direction
     * @return {undefined}
     */
    writeAnimation(animation) {
        const animations = {
            flipFront: 0x00,
            flipBack: 0x01,
            flipRight: 0x02,
            flipLeft: 0x03,
        };
        if (typeof animations[animation] === 'undefined') {
            return;
        }
        // this one is a little weird, don't understand the extra
        // argument after the flip class constant ¯\_(ツ)_/¯
        const buffer = this.createBuffer(COMMAND_KEY, [MD_CLASSES.ANIMATION, MD_METHODS.FLIP, 0x00, animations[animation], 0x00, 0x00, 0x00]);
        this.write(COMMAND_KEY, buffer);
        Logger.info(`Animation command called with ${animation} argument`);
    }

    /**
     * Convenience method for setting the drone's altitude limitation
     * @param  {Integer} altitude the altitude in meters (2m-10m for Airborne Cargo / 2m - 25m for Mambo)
     * @return {undefined}
     */
    writeMaxAltitude(altitude) {
        const buffer = this.createBuffer(COMMAND_KEY, [MD_CLASSES.PILOTING_SETTINGS, MD_METHODS.MAX_ALTITUDE, 0x00, altitude, 0x00]);
        this.write(COMMAND_KEY, buffer);
        this.emit('maxAltitudeChange', altitude);
        Logger.info(`Setting max altitude to ${altitude}m`);
    }

    /**
     * Convenience method for setting the drone's max tilt limitation
     * @param  {integer} tilt The max tilt from 0-100 (0 = 5° - 100 = 20°)
     * @return {undefined}
     */
    writeMaxTilt(tilt) {
        const buffer = this.createBuffer(COMMAND_KEY, [MD_CLASSES.PILOTING_SETTINGS, MD_METHODS.MAX_TILT, 0x00, tilt, 0x00]);
        this.write(COMMAND_KEY, buffer);
        this.emit('maxTiltChange', tilt);
        Logger.info(`Setting max tilt to ${tilt}% (20° max)`);
    }

    /**
     * Convenience method for setting the drone's max vertical speed limitation
     * @param  {integer} verticalSpeed The max vertical speed from 0.5m/s - 2m/s
     * @return {undefined}
     */
    writeMaxVerticalSpeed(verticalSpeed) {
        const buffer = this.createBuffer(COMMAND_KEY, [MD_CLASSES.SPEED_SETTINGS, MD_METHODS.MAX_VERTICAL_SPEED, 0x00, verticalSpeed, 0x00]);
        this.write(COMMAND_KEY, buffer);
        this.emit('maxVerticalSpeedChange', verticalSpeed);
        Logger.info(`Setting max vertical speed to ${verticalSpeed} m/s`);
    }

    /**
     * Convenience method for setting the drone's max rotation speed limitation
     * @param  {integer} tilt The max rotation speed from (50°-360° for Airborne Cargo / 50° - 180° for Mambo)
     * @return {undefined}
     */
    writeMaxRotationSpeed(rotationSpeed) {
        const buffer = this.createBuffer(COMMAND_KEY, [MD_CLASSES.SPEED_SETTINGS, MD_METHODS.MAX_ROTATION_SPEED, 0x00, rotationSpeed, 0x00]);
        this.write(COMMAND_KEY, buffer);
        this.emit('maxRotationSpeedChange', rotationSpeed);
        Logger.info(`Setting max rotation speed to ${rotationSpeed} °/s`);
    }

    /**
     * Event handler for when noble discovers a peripheral
     * Validates it is a drone and attempts to connect.
     *
     * @param {Peripheral} peripheral a noble peripheral class
     * @return {undefined}
     */
    onPeripheralDiscovery(peripheral) {
        if (!this.validatePeripheral(peripheral)) {
            return;
        }
        Logger.info(`Peripheral found ${peripheral.advertisement.localName}`);
        this.noble.stopScanning();
        peripheral.connect((error) => {
            if (error) {
                throw error;
            }
            this.peripheral = peripheral;
            this.setupPeripheral();
        });
    }

    /**
     * Event handler for when noble disconnect from a peripheral
     * Set connected state to false and start scanning
     * @return {undefined}
     */
    onDisconnect() {
        if (this.connected) {
            Logger.info('Disconnected from drone');
        }
        this.connected = false;
        this.noble.startScanning();
    }

    /**
     * Sets up a peripheral and finds all of it's services and characteristics
     * @return {undefined}
     */
    setupPeripheral() {
        if (!this.peripheral) {
            return;
        }
        this.peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
            if (err) {
                throw err;
            }
            this.characteristics = characteristics;

            // subscribe to these keys
            CHARACTERISTIC_MAP.forEach((key) => {
                this.getCharacteristic(key).subscribe();
            });

            // Register listener for battery notifications.
            this.getCharacteristic(BATTERY_KEY).on('data', (data, isNotification) => {
                this.onBatteryStatusChange(data, isNotification);
            });

            // Register a listener for flight status changes
            this.getCharacteristic(FLIGHT_STATUS_KEY).on('data', (data, isNotification) => {
                this.onFlightStatusChange(data, isNotification);
            });

            this.connected = true;
            Logger.info(`Device connected ${this.peripheral.advertisement.localName}`);

            // I don't know why this needs some time
            setTimeout(() => this.emit('connected'), 200);
        });
    }

    /**
     * Updates Rssi to get signal strength
     */
    updateRssi() {
        if (!this.peripheral) {
            return;
        }
        this.peripheral.updateRssi((error, rssi) => {
            if (!error) {
                this.emit('rssiUpdate', rssi);
            }
        });
    }

    /**
     * Validates a noble Peripheral class is a Parrot MiniDrone
     * @param {Peripheral} peripheral a noble peripheral object class
     * @return {boolean} If the peripheral is a drone
     */
    validatePeripheral(peripheral) {
        if (!peripheral) {
            return false;
        }
        const localName = peripheral.advertisement.localName;
        const manufacturer = peripheral.advertisement.manufacturerData;
        const matchesFilter = localName === this.options.droneFilter;

        const localNameMatch = matchesFilter || DRONE_PREFIXES.some((prefix) => localName.indexOf(prefix) >= 0);
        const manufacturerMatch = manufacturer && (MANUFACTURER_SERIALS.indexOf(manufacturer) >= 0);

          // Is TRUE according to droneFilter or if empty, for EITHER an "RS_" name OR manufacturer code.
        return localNameMatch || manufacturerMatch;
    }

    /**
     * Finds a Noble Characteristic class for the given characteristic UUID
     * @param {String} uuid The characteristics UUID
     * @return {Characteristic} The Noble Characteristic corresponding to that UUID
     */
    getCharacteristic(uuid) {
        if (!this.characteristics.length) {
            Logger.warn('BTLE Device must be connected before calling this method');
            return false;
        }
        return this.characteristics.filter((c) => c.uuid.search(new RegExp(uuid)) !== -1)[0];
    }

    /**
     * Event handler for when the drone broadcasts a flight status change
     * @param {Object} data The event data
     * @param {Boolean} isNotification If the broadcast event is a notification
     * @return {undefined}
     */
    onFlightStatusChange(data, isNotification) {
        if (!isNotification || data[2] !== 2) {
            return;
        }
        this.flightStatus = FLIGHT_STATUSES[data[6]];
        this.emit('flightStatusChange', this.flightStatus);
        Logger.debug(`Flight status = ${this.flightStatus} - ${data[6]}`);
    }

    /**
     * Event handler for when the drone broadcasts a batter status change
     * @param {Object} data he event data
     * @param {Boolean} isNotification If the broadcast event is a notification
     * @return {undefined}
     */
    onBatteryStatusChange(data, isNotification) {
        if (!isNotification) {
            return;
        }
        this.batteryLevel = data[data.length - 1];
        this.emit('batteryStatusChange', this.batteryLevel);
        Logger.info(`Battery level: ${this.batteryLevel}%`);
    }
}

module.exports = MiniDroneBtAdapter;
