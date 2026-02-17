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

function hexLeToNumber(hexString) {
    const hex = normalizeHexString(hexString);
    if (!hex || hex.length % 2 !== 0) {
        return null;
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

function formatWtuType(wtuType) {
    const namesById = {
        98: 'SOFTwell KP',
    };

    const parsed = parseInt(wtuType, 10);
    if (!Number.isNaN(parsed) && namesById[parsed]) {
        return `${parsed} (${namesById[parsed]})`;
    }

    return wtuType !== undefined && wtuType !== null ? wtuType.toString() : '';
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
