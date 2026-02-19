'use strict';

const { expect } = require('chai');
const restData = require('./restData');

/*
    Some tests to see if data return from this "very good :)" API is parsed correctly,
    according to / with sample data from: https://judo.eu/app/uploads/2024/11/API-KOMMANDOZEILEN.pdf
        and own devices: SOFTwell KP, i-dos eco
 */
describe('Data is parsed correctly', () => {
    // Gerätetyp lesen
    it('device type mapping works', () => {
        expect(restData.decodeWtuType('34')).to.equal('52 (SOFTwell P)');
        expect(restData.decodeWtuType('59')).to.equal('89 (SOFTwell P)');
        expect(restData.decodeWtuType('35')).to.equal('53 (SOFTwell S)');
        expect(restData.decodeWtuType('63')).to.equal('99 (SOFTwell S)');
        expect(restData.decodeWtuType('36')).to.equal('54 (SOFTwell K)');
        expect(restData.decodeWtuType('5A')).to.equal('90 (SOFTwell K)');
        expect(restData.decodeWtuType('47')).to.equal('71 (SOFTwell KP)');
        expect(restData.decodeWtuType('62')).to.equal('98 (SOFTwell KP)');
        expect(restData.decodeWtuType('48')).to.equal('72 (SOFTwell KS)');
        expect(restData.decodeWtuType('64')).to.equal('100 (SOFTwell KS)');
    });

    // Gerätenummer lesen
    // here it's the serial number of the Connectivity Modul, not the (SOFTwell) device itself!
    it('serial number parsing works', () => {
        expect(restData.hexLeToNumber('64d90100')).to.equal(121188);
        expect(restData.hexLeToNumber('64d9010')).to.equal(-1); // invalid hex string should return -1
    });

    // SW-Version Gerätesteuerung lesen
    // "Softwareversion" wie im online portal angezeigt, nicht SW Version des Connectivity Moduls ("Software-Version" die im auf der Webpage angezeigt wird wenn mann auf die IP des Connectivity Moduls geht)
    it('software version parsing works', () => {
        // from api-docs:
        expect(restData.decodeSoftwareVersion('6b1502')).to.equal('2.21k');
        expect(restData.decodeSoftwareVersion('0C0001')).to.equal('1.0.12');
        // expect(restData.decodeSoftwareVersion('670102')).to.equal('2.01d'); // mistake in docs and actually 2.01g?
        expect(restData.decodeSoftwareVersion('661301')).to.equal('1.19f');

        // own Softwell KP
        // expect(restData.decodeSoftwareVersion('6d0304')).to.equal('4.03'); // suffix in cloud portal not shown and actually 4.03m?

        // error cases
        expect(restData.decodeSoftwareVersion(null)).to.equal('');
        expect(restData.decodeSoftwareVersion('')).to.equal('0.0.0');
    });

    // Inbetriebnahmedatum lesen
    it('commissioning date parsing works', () => {
        expect(restData.decodeCommissioningDate('68d3ca8e')).to.equal(1758710414000); // Sep 24 2025 12:40:14
    });

    // Betriebsstundenzähler lesen
    it('runtime counter parsing works', () => {
        expect(restData.decodeRuntimeCounter('060c7500')).to.equal(2820.1); // 117 days, 12h, 6 min.

        // error cases
        expect(restData.decodeRuntimeCounter('')).to.equal(-1);
    });
});
