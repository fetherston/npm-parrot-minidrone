/* eslint no-undef: 0 */
const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const Drone = require('./../../Classes/Drone');

describe('Drone', () => {
    it('should bootstrap local vars correctly', () => {
        const drone = new Drone();
        expect(drone.network).to.equal(null);
        expect(drone.options).to.be.an('object');
        expect(drone.flightParams).to.be.an('object');
        expect(drone.eventInterval).to.be.an('object');
    });

    it('should report the initial flight status correctly', () => {
        const drone = new Drone();
        expect(drone.isFlying()).to.equal(false);
    });

    it('should set options correctly', () => {
        const updateMsOption = 500;
        const drone = new Drone({
            updateMs: updateMsOption,
        });
        expect(drone.options.updateMs).to.equal(updateMsOption);
    });

    it('should set flightParams correctly', () => {
        const drone = new Drone();
        const newParams = {
            roll: 50,
            pitch: 25,
            yaw: 10,
            altitude: 80,
        };
        expect(drone.flightParams).to.deep.equal({
            roll: 0,
            pitch: 0,
            yaw: 0,
            altitude: 0,
        });
        drone.setFlightParams(newParams);
        expect(drone.flightParams).to.deep.equal(newParams);
    });
});
