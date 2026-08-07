'use strict';

const { expect } = require('chai');
const restData = require('./restData');

/*
    Some tests to see if data return from this "very good :)" API is parsed correctly,
    according to / with sample data from: https://judo.eu/app/uploads/2024/11/API-KOMMANDOZEILEN.pdf
        and own devices: SOFTwell KP, i-dos eco
 */
describe('Data is parsed correctly', () => {
    /*
        Betriebsstatus
     */
    it('can decode date and time correctly', () => {
        expect(restData.decodeDateTime('0507170a1b1b')).to.equal(1688552847000); // 05.07.23 10:27:27 UTC
    });

    /*
        Infodaten
     */

    // Gerätetyp lesen
    it('device type mapping works', () => {
        expect(restData.decodeWtuType('34').text).to.equal('52 (SOFTwell P)');
        expect(restData.decodeWtuType('59').text).to.equal('89 (SOFTwell P)');
        expect(restData.decodeWtuType('35').text).to.equal('53 (SOFTwell S)');
        expect(restData.decodeWtuType('63').text).to.equal('99 (SOFTwell S)');
        expect(restData.decodeWtuType('36').text).to.equal('54 (SOFTwell K)');
        expect(restData.decodeWtuType('5A').text).to.equal('90 (SOFTwell K)');
        expect(restData.decodeWtuType('47').text).to.equal('71 (SOFTwell KP)');
        expect(restData.decodeWtuType('62').text).to.equal('98 (SOFTwell KP)');
        expect(restData.decodeWtuType('48').text).to.equal('72 (SOFTwell KS)');
        expect(restData.decodeWtuType('64').text).to.equal('100 (SOFTwell KS)');

        // error cases
        expect(restData.decodeWtuType('').text).to.equal('-1 (undefined)');
    });

    // Gerätenummer lesen
    // here it's the serial number of the Connectivity Modul, not the (SOFTwell) device itself!
    it('serial number parsing works', () => {
        expect(restData.decodeSerialNumber('64d90100')).to.equal('121188');

        // error cases
        expect(restData.decodeSerialNumber('64d9010')).to.equal('-1'); // invalid hex string should return -1
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

        // own i-dos eco
        // expect(restData.decodeSoftwareVersion('681101')).to.equal('1.17'); // suffix in cloud portal not shown and actually 1.17h?

        // error cases
        expect(restData.decodeSoftwareVersion(null)).to.equal('');
        expect(restData.decodeSoftwareVersion('')).to.equal('0.0.0');
    });

    // Inbetriebnahmedatum lesen
    it('commissioning date parsing works', () => {
        // from api-docs:
        expect(restData.decodeCommissioningDate('6414CB7B')).to.equal(1679084411000); // 17.3.2023 21:20 GMT+1

        // own Softwell KP
        expect(restData.decodeCommissioningDate('68d3ca8e')).to.equal(1758710414000); // Sep 24 2025 12:40:14
        // own i-dos eco
        expect(restData.decodeCommissioningDate('68D7FE5E')).to.equal(1758985822000); // Sat Sep 27 2025 17:10:22 GMT+0200
    });

    // Betriebsstundenzähler lesen
    it('runtime counter parsing works', () => {
        expect(restData.decodeRuntimeCounter('060c7500')).to.equal(2820.1); // 117 days, 12h, 6 min.

        // error cases
        expect(restData.decodeRuntimeCounter('')).to.equal(-1);
    });

    /*
        Betriebsdaten
     */

    // Weichwassermenge lesen
    it('soft water amount parsing works', () => {
        expect(restData.decodeSoftWaterAmount('2EDC0000')).to.equal(56.366);

        // error cases
        expect(restData.decodeSoftWaterAmount('')).to.equal(-1);
    });

    // Gesamtwassermenge lesen
    it('total water amount parsing works', () => {
        expect(restData.decodeTotalWaterAmount('825F0000')).to.equal(24.45);

        // error cases
        expect(restData.decodeTotalWaterAmount('')).to.equal(-1);
    });

    // i-dos eco: Statusdaten lesen (command 4300)
    it('status data parsing works including tank fill percent', () => {
        // remaining amount at bytes 19-20 as little-endian deciliters: 0x002A = 42 dl = 4.2L = 70%
        const payload = '020001030000000001000000000000000000002A001C00000082000000';
        expect(restData.decodeStatusData(payload)).to.deep.equal({
            circuitType: 2,
            operatingMode: 0,
            concentration: 3,
            errorCode: 0,
            warnings: 256,
            dosingAmount: 0,
            currentWaterFlow: 28,
            remainingAmountInTank: 4.2,
            remainingAmountInTankPercent: 70,
            waterConsumption: 130,
        });
    });

    // i-dos eco: Statusdaten with low tank level (30%)
    it('status data parsing works with 30% tank level', () => {
        // remaining amount at bytes 19-20 as little-endian deciliters: 0x0012 = 18 dl = 1.8L = 30%
        const payload = '0200010300000000010000000000000000000012001C00000082000000';
        expect(restData.decodeStatusData(payload)).to.deep.equal({
            circuitType: 2,
            operatingMode: 0,
            concentration: 3,
            errorCode: 0,
            warnings: 256,
            dosingAmount: 0,
            currentWaterFlow: 28,
            remainingAmountInTank: 1.8,
            remainingAmountInTankPercent: 30,
            waterConsumption: 130,
        });
    });

    /*
        Wasserstatistik
     */
    // Jahresstatistik
    it('year formatting for statistics works', () => {
        expect(restData.formatYearToHex(2023)).to.equal('07E7');
    });

    // TODO: improve test. (No example data in docs and no full year of own data yet)
    it('yearly statistics parsing works', () => {
        expect(
            restData.decodeYearlyStatistics(
                '00002F510000237F00000000000000000000000000000000000000000000000000000000000000000000000000000000',
            ),
        ).to.deep.equal({
            1: 12113,
            2: 9087,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
            7: 0,
            8: 0,
            9: 0,
            10: 0,
            11: 0,
            12: 0,
        });
    });
});
