/* eslint no-undef: 0 */
const chai = require('chai');
const expect = chai.expect;
const SinonChai = require('sinon-chai');
const Drone = require('./../../lib/Drone');
const MiniDroneBtAdapter = require('./../../lib/MiniDroneBtAdapter');
chai.use(SinonChai);

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

    it('should contain drone flight methods', () => {
        const drone = new Drone();
        expect(drone.trim).to.be.a('function');
        expect(drone.takePicture).to.be.a('function');
        expect(drone.land).to.be.a('function');
        expect(drone.takeOff).to.be.a('function');
        expect(drone.takeoffOrLand).to.be.a('function');
        expect(drone.emergency).to.be.a('function');
        expect(drone.animate).to.be.a('function');
    });

    it('should contain drone settings methods', () => {
        const drone = new Drone();
        expect(drone.setMaxAltitude).to.be.a('function');
        expect(drone.setMaxTilt).to.be.a('function');
        expect(drone.setMaxVerticalSpeed).to.be.a('function');
        expect(drone.setMaxRotationSpeed).to.be.a('function');
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

    it('should attempt to connect', () => {
        const drone = new Drone();
        expect(drone.network).to.equal(null);
        drone.connect();
        expect(drone.network).to.be.an.instanceof(MiniDroneBtAdapter);
    });
});
