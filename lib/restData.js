'use strict';

function normalizeHexString(value) {
    if (value === undefined || value === null) {
        return '';
    }
    return value.toString().replace(/^0x/i, '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
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

function decodeSoftwareVersion(hexString) {
    const hex = normalizeHexString(hexString).padStart(6, '0');
    const major = parseInt(hex.slice(4, 6), 16);
    const minor = parseInt(hex.slice(2, 4), 16);

    if (Number.isNaN(major) || Number.isNaN(minor)) {
        return hex;
    }
    return `${major}.${minor.toString().padStart(2, '0')}`;
}

/**
 * Formats the WTU type based on known mappings.
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

module.exports = {
    normalizeHexString,
    getRestPayloadData,
    hexLeToNumber,
    decodeSoftwareVersion,
    formatWtuType,
    toHexByte,
};
