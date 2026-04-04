'use strict';

/*
    utils:
 */

function normalizeHexString(value) {
    if (value == null) {
        return '';
    }
    return value
        .toString()
        .replace(/^0x/i, '')
        .replace(/[^a-fA-F0-9]/g, '')
        .toUpperCase();
}

function getRestPayloadData(payload) {
    if (!payload) {
        return null;
    }

    if (typeof payload === 'string') {
        try {
            return getRestPayloadData(JSON.parse(payload));
        } catch (e) {
            return normalizeHexString(payload);
        }
    }

    if (Array.isArray(payload) && payload.length > 0) {
        return getRestPayloadData(payload[0]);
    }

    if (typeof payload === 'object') {
        if (payload.data !== undefined && payload.data !== null) {
            return normalizeHexString(payload.data);
        }
        if (payload.value !== undefined && payload.value !== null) {
            return normalizeHexString(payload.value);
        }
    }

    return null;
}

/**
 * Converts a little-endian hex string to a number. Returns -1 if the input is not a valid hex string.
 *
 * @param hexString
 * @returns {number}
 */
function hexLeToNumber(hexString) {
    const hex = normalizeHexString(hexString);
    if (!hex || hex.length % 2 !== 0) {
        return -1;
    }

    let beHex = '';
    for (let i = hex.length; i > 0; i -= 2) {
        beHex += hex.slice(i - 2, i);
    }

    return parseInt(beHex, 16);
}

/**
 * Formats the WTU type based on known mappings.
 *
 * @param {number} wtuType
 * @returns {string}
 */
function formatWtuType(wtuType) {
    if (wtuType == null) {
        return '';
    }

    const namesById = {
        50: 'i-soft',
        51: 'i-soft SAFE+',
        52: 'SOFTwell P',
        53: 'SOFTwell S',
        54: 'SOFTwell K',
        60: 'i-fill 60',
        65: 'i-dos eco',
        66: 'i-soft K SAFE+',
        67: 'i-soft K',
        68: 'ZEWA i-SAFE / ZEWA i-SAFE FILT / PROM-i-SAFE',
        71: 'SOFTwell KP',
        72: 'SOFTwell KS',
        75: 'i-soft PRO',
        76: 'i-soft PRO L',
        83: 'i-soft',
        84: 'i-soft K',
        87: 'i-soft SAFE+',
        88: 'i-soft PRO',
        89: 'SOFTwell P',
        90: 'SOFTwell K',
        98: 'SOFTwell KP',
        99: 'SOFTwell S',
        100: 'SOFTwell KS',
        103: 'i-soft K SAFE+',
    };

    return `${wtuType} (${namesById[wtuType]})`;
}

function toHexByte(value) {
    const num = Math.max(0, Math.min(255, Number(value) || 0));
    return num.toString(16).padStart(2, '0').toUpperCase();
}

/*
    exported decode functions
 */

/**
 * Decodes the WTU type from a hex string.
 *
 * @param {string} hexString
 * @returns {object} The decoded WTU type in the format "number (name)" nested in object.
 */
function decodeWtuType(hexString) {
    const num = hexLeToNumber(hexString);
    return {
        num,
        text: formatWtuType(num),
    };
}

/**
 * Decodes the serial number.
 *
 * @param {string} hexString
 * @returns {string} The decoded serial number as a string.
 */
function decodeSerialNumber(hexString) {
    return hexLeToNumber(hexString).toString();
}

/**
 * Decodes the software version from a hex string according to the format observed in API-KOMMANDOZEILEN and device outputs.
 * The hex string is expected to contain 3 bytes of data, where:
 * - The first byte (patchByte) can be either a numeric patch version or an ASCII character representing a suffix.
 * - The second byte represents the minor version.
 * - The third byte represents the major version.
 *
 * @param {string} hexString
 * @returns {string} The decoded software version in the format "major.minor[patch]", where patch can be a number or a letter suffix.
 */
function decodeSoftwareVersion(hexString) {
    if (hexString == null) {
        return '';
    }

    const hex = normalizeHexString(hexString).padStart(6, '0');
    const patchByte = parseInt(hex.slice(0, 2), 16);
    const major = parseInt(hex.slice(4, 6), 16);
    const minor = parseInt(hex.slice(2, 4), 16);

    if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patchByte)) {
        return hex;
    }

    const minorStr = minor === 0 ? '0' : minor.toString().padStart(2, '0');

    // Matches examples from API-KOMMANDOZEILEN and observed device output
    // where some first-byte values are shown as letter suffixes and others as numeric patch.
    if (patchByte < 0x20 || patchByte > 0x7e) {
        return `${major}.${minorStr}.${patchByte}`;
    }

    const ascii = String.fromCharCode(patchByte).toLowerCase();

    return `${major}.${minorStr}${ascii}`;
}

/**
 * Decodes the commissioning date.
 *
 * @param {string} hexString
 * @returns {number} timestamp in milliseconds
 */
function decodeCommissioningDate(hexString) {
    return parseInt(hexString, 16) * 1000;
}

/**
 * Decodes runtime counter (command 2500) to total operating hours:
 * byte0 = minutes, byte1 = hours, byte2/3 = days (little endian)
 * Example: 060C7500 => 2820.1h (117 Tage, 12h, 6 min)
 *
 * @param {string} hexString
 * @returns {number} total operating hours, or -1 if the input is invalid
 */
function decodeRuntimeCounter(hexString) {
    const hex = normalizeHexString(hexString);
    if (!hex || hex.length < 8) {
        return -1;
    }

    const minutes = parseInt(hex.slice(0, 2), 16);
    const hours = parseInt(hex.slice(2, 4), 16);
    const daysLow = hex.slice(4, 6);
    const daysHigh = hex.slice(6, 8);
    const days = parseInt(daysHigh + daysLow, 16);

    if ([minutes, hours, days].some((v) => Number.isNaN(v))) {
        return -1;
    }

    return days * 24 + hours + minutes / 60;
}

/**
 * Decodes the soft water level from a hex string.
 *
 * @param {string} hexString
 * @returns {number} The decoded soft water level (in m^3), or -1 if the input is invalid.
 */
function decodeSoftWaterAmount(hexString) {
    const softWater = hexLeToNumber(hexString);
    if (softWater < 0) {
        return -1;
    }
    return softWater / 1000;
}

/**
 * Formats the year for the annual statistics based on the provided year value.
 *
 * @param {number} year
 * @returns {string} The formatted year as a hex string to use in /api/rest/FE00<formattedYear>
 */
function formatYearToHex(year) {
    return year.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Decodes the yearly statistics from a hex string.
 *
 * @param {string} hexString
 * @returns {object|null} An object containing the decoded yearly statistics, or null.
 */
function decodeYearlyStatistics(hexString) {
    if (hexString.length !== 96) {
        return null;
    }

    const result = {};
    for (let month = 1; month <= 12; month++) {
        const monthHex = hexString.slice((month - 1) * 8, month * 8);
        const monthValue = parseInt(monthHex, 16);
        result[month] = monthValue;
    }

    return result;
}

/**
 * Decodes the total water amount from a hex string.
 *
 * @param {string} hexString as received in response
 * @returns {number} The decoded total water amount (in m^3), or -1 if the input is invalid.
 */
function decodeTotalWaterAmount(hexString) {
    if (hexString == null || hexString.length < 4) {
        return -1;
    }

    // Only the first 4 bytes (8 hex characters) are relevant for total water amount. other 4 are unused
    const waterUsageHex = hexString.slice(0, 4);

    const waterUsage = hexLeToNumber(waterUsageHex);
    if (waterUsage < 0) {
        return -1;
    }

    return waterUsage / 1000;
}

/**
 * Decodes a date and time from a hex string.
 *
 * @param {string} hexString
 * @returns {number|null} the timestamp in milliseconds, or null if the input is invalid.
 */
function decodeDateTime(hexString) {
    if (hexString == null || hexString.length !== 12) {
        return null;
    }

    // Docs: Je ein Byte: Tag, Monat, Jahr, Stunde, Minute, Sekunde --> Jahr
    // 00 .. 99

    const day = parseInt(hexString.slice(0, 2), 16);
    const month = parseInt(hexString.slice(2, 4), 16);
    const year = parseInt(hexString.slice(4, 6), 16) + 2000;
    const hour = parseInt(hexString.slice(6, 8), 16);
    const minute = parseInt(hexString.slice(8, 10), 16);
    const second = parseInt(hexString.slice(10, 12), 16);

    if ([day, month, year, hour, minute, second].some((v) => Number.isNaN(v))) {
        return null;
    }

    return Date.UTC(year, month - 1, day, hour, minute, second);
}

/**
 * Decodes the status data from a hex string.
 *
 * @param {string} hexString
 * @returns {object|null} An object containing the decoded status data, or null if the input is invalid.
 */
function decodeStatusData(hexString) {
    if (hexString == null || hexString.length !== 58) {
        return null;
    }

    /*
        Format according to docs:
        1 byte Schaltungstyp
        1 byte Betriebsmodus
        1 byte unbenutzt
        1 byte Konzentration (min, Norm, max)
        1 byte unbenutzt
        2 byte Fehlercode
        2 byte Warnmeldungen
        6 byte unbenutzt
        2 byte Dosiermenge
        2 byte akt. Wasserdurchfluss in l/h
        2byte Restmenge im Behälter
        4 byte Wasserverbrauch in L
        4 byte unbenutzt
     */

    return {
        circuitType: parseInt(hexString.slice(0, 2), 16),
        operatingMode: parseInt(hexString.slice(2, 4), 16),
        concentration: parseInt(hexString.slice(8, 10), 16),
        errorCode: parseInt(hexString.slice(12, 16), 16),
        warnings: parseInt(hexString.slice(16, 20), 16),
        dosingAmount: parseInt(hexString.slice(32, 36), 16) / 1000, // convert to m^3
        currentWaterFlow: parseInt(hexString.slice(36, 40), 16),
        remainingAmountInTank: parseInt(hexString.slice(40, 44), 16) / 1000, // convert to m^3
        waterConsumption: parseInt(hexString.slice(44, 52), 16),
    };
}

/**
 * Decodes the dosage from a hex string.
 *
 * @param {string} hexString
 * @returns {object} The decoded dosage, or null if the input is invalid.
 */
function decodeDosage(hexString) {
    if (hexString == null || hexString.length !== 4) {
        return null;
    }

    // TODO: figure out and implement
    return {};
}

module.exports = {
    normalizeHexString,
    getRestPayloadData,
    hexLeToNumber,
    toHexByte,
    formatYearToHex,
    // actual decoders intended to be used outside of this module:
    decodeWtuType,
    decodeSerialNumber,
    decodeSoftwareVersion,
    decodeCommissioningDate,
    decodeRuntimeCounter,
    decodeSoftWaterAmount,
    decodeYearlyStatistics,
    decodeTotalWaterAmount,
    decodeStatusData,
    decodeDosage,
    decodeDateTime,
};
