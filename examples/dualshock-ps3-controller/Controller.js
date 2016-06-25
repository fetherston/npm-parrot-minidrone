const DualShock = require('dualshock-controller');

/**
 * Wrapper class that abstracts and normalizes
 * some of the inputs from the Dualshock NPM package
 */
class Controller {

    constructor(options = {}) {
        const defaults = {
            // 'dualshock4-generic-driver' to use newer controller,
            config: 'dualShock3',
            // smooths the output from the accelerometers (moving averages) defaults to true
            accelerometerSmoothing: true,
            // smooths the output from the analog sticks (moving averages) defaults to false
            analogStickSmoothing: false,
            // limits the input range of the analog sticks
            sensitivity: 100,
            // No-op event handlers designed to be overridden via the options object
            onRightAnalogMove: () => {},
            onLeftAnalogMove: () => {},
            onXPress: () => {},
            onSquarePress: () => {},
            onCirclePress: () => {},
            onTrianglePress: () => {},
            onStartPress: () => {},
            onL1Press: () => {},
            onL2Press: () => {},
            onR1Press: () => {},
            onR2Press: () => {},
        };

        this.options = Object.assign({}, defaults, options);

        // TODO: only pass DS options here
        this.controller = new DualShock(this.options);

        // add event handlers
        this.controller.on('start:release', this.options.onStartPress);
        this.controller.on('left:move', (data) => this.onLeftAnalogMove(data));
        this.controller.on('right:move', (data) => this.onRightAnalogMove(data));
        this.controller.on('square:release', this.options.onSquarePress);
        this.controller.on('triangle:release', this.options.onTrianglePress);
        this.controller.on('circle:release', this.options.onCirclePress);
        this.controller.on('x:release', this.options.onXPress);
        this.controller.on('l1:release', this.options.onL1Press);
        this.controller.on('l2:release', this.options.onL2Press);
        this.controller.on('r1:release', this.options.onR1Press);
        this.controller.on('r2:release', this.options.onR2Press);

        this.controller.connect();
    }

    /**
     * Normalizes the analog inputs to return a number
     * between 0 and whatever sensitivity is set to
     *
     * @param  {object} value the data object from the move event
     * @return {object}       the data object with the processed data
     */
    normalizeAnalogInputs(value) {
        return Object.keys(value).reduce((prev, key) => {
            const val = Math.round((128 - value[key]) / 128 * this.options.sensitivity);
            const cleanPrev = prev;
            cleanPrev[key] = Math.abs(val) > 1 ? val : 0;
            return prev;
        }, {});
    }

    /**
     * Event handler for the left analog stick
     * normalizes and inverts the x value
     *
     * @param  {data} data the event data object
     * @return {undefined}
     */
    onLeftAnalogMove(data) {
        const cleanData = this.normalizeAnalogInputs(data);
        cleanData.x = cleanData.x * -1; // inverse
        this.options.onLeftAnalogMove(cleanData);
    }

    /**
     * Event handler for the right analog stick
     * normalizes and inverts the x value
     *
     * @param  {data} data the event data object
     * @return {undefined}
     */
    onRightAnalogMove(data) {
        const cleanData = this.normalizeAnalogInputs(data);
        cleanData.x = cleanData.x * -1; // inverse
        this.options.onRightAnalogMove(cleanData);
    }
}

module.exports = Controller;
