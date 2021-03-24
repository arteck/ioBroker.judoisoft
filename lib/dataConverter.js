

function getInValue(deviceData, index) {

    var value = null, subIndex = null;
    if (index.toString().indexOf('_') > -1) {
        t = index.toString().split('_');
        index = parseInt(t[0]);
        subIndex = parseInt(t[1]);
    }
    index = parseInt(index);
    var data = (deviceData[index] != undefined && deviceData[index] != null) ? deviceData[index].data : "";
    switch (index) {
       
        // Gernummer / Get_JDO_SerialNo
        // 4 Bytes unsigned
        case 3:
            if (data.length != 0) {
                var v1 = data.slice(0, 2);
                var v2 = data.slice(2, 4);
                var v3 = data.slice(4, 6);
                var v4 = data.slice(6, 8);
                value = parseInt(v4 + '' + v3 + '' + v2 + '' + v1, 16);
            } else value = "";
            break;

        // Betriebsstundenzaehler / Get_runntime
        // 4 Bytes unsigned
        // Minuter 8bit, Stunden 8bit, Tage 16bit
        case 5:
            if (data.length != 0) {
                var minutes = parseInt(data.slice(0, 2), 16);
                var hours = parseInt(data.slice(2, 4), 16);
                var days_low = data.slice(4, 6);
                var days_high = data.slice(6, 8);
                var days = parseInt(days_high + '' + days_low, 16);
                value = days + ':' + hours + ':' + minutes;
            } else value = data;
            break;

        // Stunden bis zur naechsten Wartung / Get_Service_Time
        // 6 Bytes unsigned
        // 16 bit Stunden bis zur naechsten Wartung
        // 16 bit Registrierte Wartungen
        // 16 bit Angeforederte Wartungen
        case 7:
            if (data.length != 0) {
                var v1_high = data.slice(0, 2);
                var v1_low = data.slice(2, 4);
                var v1 = Math.floor(parseInt(v1_low + "" + v1_high, 16) / 24);
                var v2_high = data.slice(4, 6);
                var v2_low = data.slice(6, 8);
                var v2 = parseInt(v2_low + "" + v2_high, 16);

                var v3_high = data.slice(8, 10);
                var v3_low = data.slice(10, 12);
                var v3 = parseInt(v3_low + "" + v3_high, 16);

                value = v1 + ':' + v2 + ':' + v3;
            } else value = data;
            break;


        // Gesamtwasserverbrauch / Get_TotalWater
        // 4 Byte
        case 8:
            if (data.length != 0 && data.length == 8) {
                var v1 = data.slice(0, 2);
                var v2 = data.slice(2, 4);
                var v3 = data.slice(4, 6);
                var v4 = data.slice(6, 8);
                var v = v4 + '' + v3 + '' + v2 + '' + v1;

                value = parseInt(v, 16);
                /*if(v > 99)
                    value = (v / 1000).toFixed(2) + " m&sup3;";
                else
                    value = v + ' ' + _lang[GlobalObj['language']].liter;*/

            } else value = 0;
            break;


        // Weichwassermenge / Get_SoftWater
        // Behandelte Wassermenge
        // 4 Byte
        case 9:
            if (data.length >= 8) {
                var v1 = data.slice(0, 2);
                var v2 = data.slice(2, 4);
                var v3 = data.slice(4, 6);
                var v4 = data.slice(6, 8);
                var v = v4 + '' + v3 + '' + v2 + v1;

                /*v = parseInt(v,16);
                if(v > 99)
                    value = (v / 1000).toFixed(2) + " m&sup3;";
                else
                    value = v + ' ' + _lang[GlobalObj['language']].liter;*/

                value = parseInt(v, 16);
            } else value = 0;
            break;


        // UP Time des Geraetes
        // 4 Byte
        // Minuten : Stunden : TageLow - TageHigh
        case 14:
            if (data.length != 0) {
                var minuten = parseInt(data.slice(0, 2));
                var stunden = parseInt(data.slice(2, 4));
                var tageLow = data.slice(4, 6);
                var tageHigh = data.slice(6, 8);
                var tage = parseInt(tageHigh + '' + tageLow, 16);
                value = tage + ':' + stunden + ':' + minuten;
            } else value = data;
            break;

        // Absoluten Salzstand lesen / GET_SALT_Volume
        // 4 Byte
        // low(Salzgew) | high(Salzgew) | low(Reichweite) | high(Reichweite)
        case 94:
            if (data.length != 0) {
                var lSalzstand = data.slice(0, 2);
                var hSalzstand = data.slice(2, 4);
                var lReichweite = data.slice(4, 6);
                var hReichweite = data.slice(6, 8);
                var salzstand = parseInt(hSalzstand + '' + lSalzstand, 16);
                var reichweite = parseInt(hReichweite + '' + lReichweite, 16);
                value = salzstand + ':' + reichweite;
            } else value = data;
            break;

        case 790:
            value = "";
            if (data.length == 66) {
                if (subIndex !== null) {
                    data = data.toString().split(':')[1];
                    switch (subIndex) {

                        //Notstrommodul Ja/Nein
                        case 2:
                            value = parseInt("0x"+data.slice(2, 4));
                            value = (+value).toString(2);
                            while (value.length<8) value="0"+value;
                            break;

                        // Anzeige resthaerte
                        case 8:
                            value = parseInt(data.slice(8*2, 9*2), 16);
                            break;

                        // Anzeige rohhaerte / aktuelle Rohwasserhaerte
                        case 10:
                            value = parseInt(data.slice(10*2, 11*2), 16);
                            break;

                        // Anzeige rohhaerte / Rohwasserhaerte in �dH
                        case 26:
                            value = parseInt(data.slice(26*2, 27*2),16);
                            break;

                        // Wasserdurchfluss
                        case 1617:
                            var tWW_DURCHFLUSS_LO = parseInt(data.slice(32, 34), 16);
                            var tWW_DURCHFLUSS_HI = parseInt(data.slice(34, 36), 16);
                            value = (tWW_DURCHFLUSS_HI * 256) + tWW_DURCHFLUSS_LO;
                            break;
                    }
                }else{

                }
            }
            break;

        // Wasserstop Daten
        case 792:
            value = "";
            if (data.length == 66) {
                if (subIndex !== null) {
                    data = data.toString().split(':')[1];
                    switch (subIndex) {

                        // Wasserstop statusflag
                        case 0:
                            var standby = parseInt(data.slice(0, 2),16);
                            var standbyBinary = (+standby).toString(2);
                            value = standbyBinary;
                            break;

                        // Standby Modus - gibt Stunden zurueck
                        case 9:
                            var standby = data.slice(18, 20);
                            value = parseInt(standby, 16);
                            break;

                        // eingestellter Urlaubsmodus
                        case 18:
                            var urlaubsmodus = data.slice(36, 38);
                            value = parseInt(urlaubsmodus, 16);
                            break;

                        // eingestellter sleepmoduszeit
                        case 19:
                            var urlaubsmodus = data.slice(38, 40);
                            value = parseInt(urlaubsmodus, 16);
                            break;

                        //Max. Durchfluss - 12-low, 13-high
                        case 1213:
                            var maxDurchflussLow = data.slice(24, 26);
                            var maxDurchflussHigh = data.slice(26, 28);
                            value = parseInt(maxDurchflussHigh + '' + maxDurchflussLow, 16);
                            break;

                        //Max. Entnahmemenge
                        case 1415:
                            var maxMengeLow = data.slice(28, 30);
                            var maxMengeHigh = data.slice(30, 32);
                            value = parseInt(maxMengeHigh + '' + maxMengeLow, 16);
                            break;

                        //Max. Entnahmezeit
                        case 1617:
                            var maxZeitLow = data.slice(32, 34);
                            var maxZeitHigh = data.slice(34, 36);
                            value = parseInt(maxZeitHigh + '' + maxZeitLow, 16);
                            break;

                        // kleinleckagepruefung status
                        case 30:
                            var bit = parseInt(data.slice(30*2, 31*2), 16).toString(2);
                            while (bit.length<8) bit="0"+bit;
                            value = bit;
                            break;
                    }
                }
            }
            break;

    }
    return value;
}

function getBitmask(x) {
    var bits = [128, 64, 32, 16, 8, 4, 2, 1];

    var bitmask = [];

    for (var i = 0; i < bits.length; i++) {
        if (bits[i] <= x) {
            bitmask.push(bits[i]);
            x -= bits[i];
        }
    }

    return JSON.stringify(bitmask.reverse());
}


exports.getInValue = getInValue;
