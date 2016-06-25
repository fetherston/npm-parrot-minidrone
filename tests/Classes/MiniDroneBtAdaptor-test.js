/* eslint no-undef: 0 */
const chai = require('chai');
const expect = chai.expect;
const SinonChai = require('sinon-chai');
const sinon = require('sinon');
const MiniDroneBtAdaptor = require('./../../Classes/MiniDroneBtAdaptor');
const bufferEqual = require('./helpers/bufferEqual');
chai.use(SinonChai);

// TODO: this could be cleaned up to use the same constants in MiniDroneBtAdaptor
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

describe('MiniDroneBtAdaptor', () => {
    it('should bootstrap local vars correctly', () => {
        const adaptor = new MiniDroneBtAdaptor();
        expect(adaptor.connected).to.equal(false);
        expect(adaptor.characteristics).to.be.instanceof(Array);
        expect(adaptor.lastFpWrite).to.equal(0);
        expect(adaptor.flightStatus).to.equal(null);
        expect(adaptor.flightParams).to.be.an('object');
        expect(adaptor.steps).to.be.an('object');
        expect(adaptor.batteryLevel).to.equal('Unknown');
        expect(adaptor.noble).to.equal(require('noble'));
    });

    it('should correctly increment steps after writing over the network', () => {
        const adaptor = new MiniDroneBtAdaptor();
        adaptor.characteristics = mockCharacteristics;
        expect(adaptor.steps.fa0a).to.equal(0);
        expect(adaptor.steps.fa0b).to.equal(0);
        expect(adaptor.steps.fa0c).to.equal(0);

        adaptor.writeTakeoff();
        adaptor.writeFlightParams({
            roll: 4,
        });
        adaptor.writeEmergency();

        expect(adaptor.steps.fa0a).to.equal(1);
        expect(adaptor.steps.fa0b).to.equal(1);
        expect(adaptor.steps.fa0c).to.equal(1);
    });

    it('getCharacteristic should successfully return the correct characteristic', () => {
        const adaptor = new MiniDroneBtAdaptor();
        adaptor.characteristics = mockCharacteristics;
        expect(adaptor.getCharacteristic('fa0c').uuid).to.equal('fa0c');
    });

    it('should write the correct takeoff buffer', () => {
        const adaptor = new MiniDroneBtAdaptor();
        const takeoffBuffer = new Buffer([0x02, 1 & 0xFF, 0x02, 0x00, 0x01, 0x00]);
        adaptor.characteristics = mockCharacteristics;

        adaptor.writeTakeoff();
        const spy = adaptor.characteristics[1].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, takeoffBuffer),
        'did not match expected takeoff buffer'), true);
    });

    it('should write the correct landing buffer', () => {
        const adaptor = new MiniDroneBtAdaptor();
        const buff = new Buffer([0x02, 1 & 0xFF, 0x02, 0x00, 0x03, 0x00]);
        adaptor.characteristics = mockCharacteristics;

        adaptor.writeLand();
        const spy = adaptor.characteristics[1].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, buff),
        'did not match expected landing buffer'), true);
    });

    it('should write the correct emergency buffer', () => {
        const adaptor = new MiniDroneBtAdaptor();
        const buff = new Buffer([0x02, 1 & 0xFF, 0x02, 0x00, 0x04, 0x00]);
        adaptor.characteristics = mockCharacteristics;

        adaptor.writeEmergency();
        const spy = adaptor.characteristics[2].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, buff),
        'did not match expected emergency buffer'), true);
    });

    it('should write the correct picture buffer', () => {
        const adaptor = new MiniDroneBtAdaptor();
        const buff = new Buffer([0x02, 1 & 0xFF, 0x02, 0x06, 0x01, 0x00]);
        adaptor.characteristics = mockCharacteristics;

        adaptor.writeTakePicture();
        const spy = adaptor.characteristics[1].write;
        expect(spy).to.have.been.calledWith(sinon.match((value) =>
            bufferEqual(value, buff),
        'did not match expected picture buffer'), true);
    });

    it('should correctly validate peripherals as drones', () => {
        const adaptor = new MiniDroneBtAdaptor();
        const isDrone = adaptor.validatePeripheral(mockPeripheral);
        const isNotDrone = adaptor.validatePeripheral(mockFalsePeripheral);
        expect(isDrone).to.equal(true);
        expect(isNotDrone).to.equal(true);
    });
});
