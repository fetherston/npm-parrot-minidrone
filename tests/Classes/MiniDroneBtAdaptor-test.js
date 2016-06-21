/* eslint no-undef: 0 */
const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const MiniDroneBtAdaptor = require('./../../Classes/MiniDroneBtAdaptor');

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
});
