// converts from judo-cloud

function getInValue(deviceData, index) {

    let value = null, subIndex = null;
    if (index.toString().indexOf('_') > -1) {
        t = index.toString().split('_');
        index = parseInt(t[0]);
        subIndex = parseInt(t[1]);
    }
    index = parseInt(index);
    let data = (deviceData[index] != undefined && deviceData[index] != null) ? deviceData[index].data : "";
    switch (index) {
       // SW - Version / Get SW_Version
        // 3 Bytes
        case 1:
            let svMinor = parseInt(data.slice(2, 4), 16);
            let svMajor = parseInt(data.slice(4, 6), 16);
            let minor = "";
            if (svMinor < 10) {
                if (svMinor == 0)
                    minor = "0";
                else
                    minor = "0" + svMinor;
            }
            else minor = svMinor;
            value = svMajor + "." + minor + "";
            break;


        // HW - Version / Get_HW_Versionb
        // 2 Bytes
        case 2:
            let hvMinor = parseInt(data.slice(0, 2), 16);
            let hvMajor = parseInt(data.slice(2, 4), 16);
            if (0 < hvMinor && hvMinor < 10)
                hvMinor = "0"+hvMinor;

            value = hvMajor + '.' + hvMinor;
            break;

        // Gernummer / Get_JDO_SerialNo
        // 4 Bytes unsigned
        case 3:
            if (data.length != 0) {
                let v1 = data.slice(0, 2);
                let v2 = data.slice(2, 4);
                let v3 = data.slice(4, 6);
                let v4 = data.slice(6, 8);
                value = parseInt(v4 + '' + v3 + '' + v2 + '' + v1, 16);
            } else value = "";
            break;

        // Betriebsstundenzaehler / Get_runntime
        // 4 Bytes unsigned
        // Minuter 8bit, Stunden 8bit, Tage 16bit
        case 5:
            if (data.length != 0) {
                let minutes = parseInt(data.slice(0, 2), 16);
                let hours = parseInt(data.slice(2, 4), 16);
                let days_low = data.slice(4, 6);
                let days_high = data.slice(6, 8);
                let days = parseInt(days_high + '' + days_low, 16);
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
                let v1_high = data.slice(0, 2);
                let v1_low = data.slice(2, 4);
                let v1 = Math.floor(parseInt(v1_low + "" + v1_high, 16) / 24);
                let v2_high = data.slice(4, 6);
                let v2_low = data.slice(6, 8);
                let v2 = parseInt(v2_low + "" + v2_high, 16);

                let v3_high = data.slice(8, 10);
                let v3_low = data.slice(10, 12);
                let v3 = parseInt(v3_low + "" + v3_high, 16);

                value = v1 + ':' + v2 + ':' + v3;
            } else value = data;
            break;


        // Gesamtwasserverbrauch / Get_TotalWater
        // 4 Byte
        case 8:
            if (data.length != 0 && data.length == 8) {
                let v1 = data.slice(0, 2);
                let v2 = data.slice(2, 4);
                let v3 = data.slice(4, 6);
                let v4 = data.slice(6, 8);
                let v = v4 + '' + v3 + '' + v2 + '' + v1;

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
                let v1 = data.slice(0, 2);
                let v2 = data.slice(2, 4);
                let v3 = data.slice(4, 6);
                let v4 = data.slice(6, 8);
                let v = v4 + '' + v3 + '' + v2 + v1;

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
                let minuten = parseInt(data.slice(0, 2));
                let stunden = parseInt(data.slice(2, 4));
                let tageLow = data.slice(4, 6);
                let tageHigh = data.slice(6, 8);
                let tage = parseInt(tageHigh + '' + tageLow, 16);
                value = tage + ':' + stunden + ':' + minuten;
            } else value = data;
            break;

        // Absoluten Salzstand lesen / GET_SALT_Volume
        // 4 Byte
        // low(Salzgew) | high(Salzgew) | low(Reichweite) | high(Reichweite)
        case 94:
            if (data.length != 0) {
                let lSalzstand = data.slice(0, 2);
                let hSalzstand = data.slice(2, 4);
                let lReichweite = data.slice(4, 6);
                let hReichweite = data.slice(6, 8);
                let salzstand = parseInt(hSalzstand + '' + lSalzstand, 16);
                let reichweite = parseInt(hReichweite + '' + lReichweite, 16);
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
                            let tWW_DURCHFLUSS_LO = parseInt(data.slice(32, 34), 16);
                            let tWW_DURCHFLUSS_HI = parseInt(data.slice(34, 36), 16);
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
                            let standby1 = parseInt(data.slice(0, 2),16);
                            let standbyBinary = (standby1).toString(2);
                            value = standbyBinary;
                            break;

                        // Standby Modus - gibt Stunden zurueck
                        case 9:
                            let standby2 = data.slice(18, 20);
                            value = parseInt(standby2, 16);
                            break;

                        // eingestellter Urlaubsmodus
                        case 18:
                            let urlaubsmodus1 = data.slice(36, 38);
                            value = parseInt(urlaubsmodus1, 16);
                            break;

                        // eingestellter sleepmoduszeit
                        case 19:
                            let urlaubsmodus2 = data.slice(38, 40);
                            value = parseInt(urlaubsmodus2, 16);
                            break;

                        //Max. Durchfluss - 12-low, 13-high
                        case 1213:
                            let maxDurchflussLow = data.slice(24, 26);
                            let maxDurchflussHigh = data.slice(26, 28);
                            value = parseInt(maxDurchflussHigh + '' + maxDurchflussLow, 16);
                            break;

                        //Max. Entnahmemenge
                        case 1415:
                            let maxMengeLow = data.slice(28, 30);
                            let maxMengeHigh = data.slice(30, 32);
                            value = parseInt(maxMengeHigh + '' + maxMengeLow, 16);
                            break;

                        //Max. Entnahmezeit
                        case 1617:
                            let maxZeitLow = data.slice(32, 34);
                            let maxZeitHigh = data.slice(34, 36);
                            value = parseInt(maxZeitHigh + '' + maxZeitLow, 16);
                            break;

                        // kleinleckagepruefung status
                        case 30:
                            let bit = parseInt(data.slice(30*2, 31*2), 16).toString(2);
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

exports.getInValue = getInValue;
