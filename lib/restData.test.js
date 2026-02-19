'use strict';

const { expect } = require('chai');
const restData = require('./restData');

// according to / with sample data from: https://judo.eu/app/uploads/2024/11/API-KOMMANDOZEILEN.pdf and own devices
describe('Data is parsed correctly', () => {
    // Gerätetyp lesen
    it('device type mapping works', () => {
        const format = (/** @type {string | number} "data" value found in response */ responseData) => {
            return restData.formatWtuType(restData.hexLeToNumber(responseData));
        };
        expect(format('34')).to.equal('52 (SOFTwell P)');
        expect(format('59')).to.equal('89 (SOFTwell P)');
        expect(format('35')).to.equal('53 (SOFTwell S)');
        expect(format('63')).to.equal('99 (SOFTwell S)');
        expect(format('36')).to.equal('54 (SOFTwell K)');
        expect(format('5A')).to.equal('90 (SOFTwell K)');
        expect(format('47')).to.equal('71 (SOFTwell KP)');
        expect(format('62')).to.equal('98 (SOFTwell KP)');
        expect(format('48')).to.equal('72 (SOFTwell KS)');
        expect(format('64')).to.equal('100 (SOFTwell KS)');
    });

    // Gerätenummer lesen/
    it('serial number parsing works', () => {
        expect(restData.hexLeToNumber('64d90100')).to.equal(121188);
        expect(restData.hexLeToNumber('64d9010')).to.equal(-1); // invalid hex string should return -1
    })

    // SW-Version Gerätesteuerung lesen
    // "Softwareversion" wie im online portal angezeigt, nicht SW Version des Connectivity Moduls ("Software-Version" die im auf der Webpage angezeigt wird wenn mann auf die IP des Connectivity Moduls geht)
    it('software version parsing works', () => {
        // from api-docs:
        expect(restData.decodeSoftwareVersion('6b1502')).to.equal('2.21k');
        expect(restData.decodeSoftwareVersion('0C0001')).to.equal('1.0.12');
        expect(restData.decodeSoftwareVersion('670102')).to.equal('2.01d');
        expect(restData.decodeSoftwareVersion('661301')).to.equal('1.19f');

        // own Softwell KP
        expect(restData.decodeSoftwareVersion('6d0304')).to.equal('4.03m');
    });
});
