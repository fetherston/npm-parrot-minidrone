/* eslint no-undef: 0 */
const chai = require('chai');
const expect = chai.expect;
const SinonChai = require('sinon-chai');
const sinon = require('sinon');
const MiniDroneBtAdapter = require('./../../lib/MiniDroneBtAdapter');
const bufferEqual = require('./helpers/bufferEqual');
chai.use(SinonChai);

// TODO: this could be cleaned up to use the same constants in MiniDroneBtAdapter
const mockCharacteristics = [
    {
        uuid: 'fa0a',
        write: sinon.spy(),
    },
    {
        uuid: 'fa0b',
        write: sinon.spy(),
    },
    {
        uuid: 'fa0c',
        write: sinon.spy(),
    },
];

const mockPeripheral = {
    advertisement: {
        localName: 'Travis_1111111111',
        manufacturerData: '4300cf1900090100',
    },
};

const mockFalsePeripheral = {
    advertisement: {
        localName: 'WTF_1111111111',
        manufacturerData: '4300cf1900090100',
    },
};

describe('MiniDroneBtAdapter', () => {
    it('should bootstrap local vars correctly', () => {
        const adapter = new MiniDroneBtAdapter();
        expect(adapter.connected).to.equal(false);
        expect(adapter.characteristics).to.be.instanceof(Array);
        expect(adapter.lastFpWrite).to.equal(0);
        expect(adapter.flightStatus).to.equal(null);
        expect(adapter.flightParams).to.be.an('object');
        expect(adapter.steps).to.be.an('object');
        expect(adapter.batteryLevel).to.equal('Unknown');
        expect(adapter.noble).to.equal(require('noble'));
        expect(adapter.options.droneFilter).to.equal('');

        const options = {
            autoconnect: true,
            droneFilter: 'test',
        };
        const filteredAdapter = new MiniDroneBtAdapter(options);
        expect(filteredAdapter.options.autoconnect).to.equal(true);
        expect(filteredAdapter.options.droneFilter).to.equal('test');
    });

    it('should correctly increment steps after writing over the network', () => {
        const adapter = new MiniDroneBtAdapter();
        adapter.characteristics = mockCharacteristics;
        expect(adapter.steps.fa0a).to.equal(0);
        expect(adapter.steps.fa0b).to.equal(0);
        expect(adapter.steps.fa0c).to.equal(0);

        adapter.writeTakeoff();
        adapter.writeFlightParams({
            roll: 4,
        });
        adapter.writeEmergency();

        expect(adapter.steps.fa0a).to.equal(1);
        expect(adapter.steps.fa0b).to.equal(1);
        expect(adapter.steps.fa0c).to.equal(1);
    });

    it('getCharacteristic should successfully return the correct characteristic', () => {
        const adapter = new MiniDroneBtAdapter();
        adapter.characteristics = mockCharacteristics;
        expect(adapter.getCharacteristic('fa0c').uuid).to.equal('fa0c');
    });

    it('should write the correct takeoff buffer', () => {
        const adapter = new MiniDroneBtAdapter();
        const takeoffBuffer = new Buffer([0x02, 1 & 0xFF, 0x02, 0x00, 0x01, 0x00]);
        adapter.characteristics = mockCharacteristics;

        adapter.writeTakeoff();
        const spy = adapter.characteristics[1].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, takeoffBuffer),
        'did not match expected takeoff buffer'), true);
    });

    it('should write the correct landing buffer', () => {
        const adapter = new MiniDroneBtAdapter();
        const buff = new Buffer([0x02, 1 & 0xFF, 0x02, 0x00, 0x03, 0x00]);
        adapter.characteristics = mockCharacteristics;

        adapter.writeLand();
        const spy = adapter.characteristics[1].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, buff),
        'did not match expected landing buffer'), true);
    });

    it('should write the correct emergency buffer', () => {
        const adapter = new MiniDroneBtAdapter();
        const buff = new Buffer([0x02, 1 & 0xFF, 0x02, 0x00, 0x04, 0x00]);
        adapter.characteristics = mockCharacteristics;

        adapter.writeEmergency();
        const spy = adapter.characteristics[2].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, buff),
        'did not match expected emergency buffer'), true);
    });

    it('should write the correct picture buffer', () => {
        const adapter = new MiniDroneBtAdapter();
        const buff = new Buffer([0x02, 1 & 0xFF, 0x02, 0x06, 0x01, 0x00]);
        adapter.characteristics = mockCharacteristics;

        adapter.writeTakePicture();
        const spy = adapter.characteristics[1].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, buff),
        'did not match expected picture buffer'), true);
    });

    it('should write the correct max altitude buffer', () => {
        const adapter = new MiniDroneBtAdapter();
        const buff = new Buffer([0x02, 1 & 0xFF, 0x02, 0x08, 0x00, 0x00, 2, 0x00]);
        adapter.characteristics = mockCharacteristics;

        adapter.writeMaxAltitude(2);
        const spy = adapter.characteristics[1].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, buff),
        'did not match expected max altitude buffer'), true);
    });

    it('should write the correct max tilt buffer', () => {
        const adapter = new MiniDroneBtAdapter();
        const buff = new Buffer([0x02, 1 & 0xFF, 0x02, 0x08, 0x01, 0x00, 10, 0x00]);
        adapter.characteristics = mockCharacteristics;

        adapter.writeMaxTilt(10);
        const spy = adapter.characteristics[1].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, buff),
        'did not match expected max tilt buffer'), true);
    });

    it('should write the correct max vertical speed buffer', () => {
        const adapter = new MiniDroneBtAdapter();
        const buff = new Buffer([0x02, 1 & 0xFF, 0x02, 0x01, 0x00, 0x00, 1, 0x00]);
        adapter.characteristics = mockCharacteristics;

        adapter.writeMaxVerticalSpeed(1);
        const spy = adapter.characteristics[1].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, buff),
        'did not match expected max vertical speed buffer'), true);
    });

    it('should write the correct max rotation speed buffer', () => {
        const adapter = new MiniDroneBtAdapter();
        const buff = new Buffer([0x02, 1 & 0xFF, 0x02, 0x01, 0x01, 0x00, 100, 0x00]);
        adapter.characteristics = mockCharacteristics;

        adapter.writeMaxRotationSpeed(100);
        const spy = adapter.characteristics[1].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, buff),
        'did not match expected max rotation speed buffer'), true);
    });

    it('should correctly validate peripherals as drones', () => {
        const adapter = new MiniDroneBtAdapter();
        const isDrone = adapter.validatePeripheral(mockPeripheral);
        const isNotDrone = adapter.validatePeripheral(mockFalsePeripheral);
        expect(isDrone).to.equal(true);
        expect(isNotDrone).to.equal(true);
    });
});
