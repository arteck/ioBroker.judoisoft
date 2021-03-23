var months = [];
months['Jan'] = 1;
months['Feb'] = 2;
months['Mar'] = 3;
months['Apr'] = 4;
months['May'] = 5;
months['Jun'] = 6;
months['Jul'] = 7;
months['Aug'] = 8;
months['Sep'] = 9;
months['Oct'] = 10;
months['Nov'] = 11;
months['Dec'] = 12;

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
        // SW - Version / Get SW_Version
        // 3 Bytes
        case 1:
            var svMinor = parseInt(data.slice(2, 4), 16);
            var svMajor = parseInt(data.slice(4, 6), 16);
            var minor = "";
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
            var hvMinor = parseInt(data.slice(0, 2), 16);
            var hvMajor = parseInt(data.slice(2, 4), 16);
            if (0 < hvMinor && hvMinor < 10)
                hvMinor = "0"+hvMinor;

            value = hvMajor + '.' + hvMinor;
            break;

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


        // Bestellnummer des Ger / Get_JDO_OrderNo
        // 4 Bytes unsigned
        case 4:
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


        // Inbetriebnahmedatum / Get_init_Date
        // 4 Bytes unsigned
        //alert(data);
        case 6:
            if (data.length != 0) {
                var date = parseInt(data, 16);
                var d = new Date(date * 1000);
                v = d.toString().split(' GMT')[0].split(' ');
                //value = v[2] + '/' + months[v[1]] + '/' + v[3] + ' ' + v[4];
                value = parseInt(v[2]) + '.' + months[v[1]] + '.' + v[3];
                //Thu Jul 14 2016 09:13:54
            } else value = "";
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


        // Sprache / GET_LANGUAGE
        // 1 Byte
        // 0 - deutsch
        // 1 - englisch
        // 2 - franzoesisch
        // 3 - flaemisch
        // 4 - italienisch
        case 10:
            if (data.length != 0) {
                value = parseInt(data, 16);
            } else value = data;
            break;


        // Geraete Einheit / Get_Unit
        // 1 Byte
        // 0 - dH
        // 1 - eH
        // 2 - Fh
        // 3 - gpg
        // 4 - ppm
        // 5 - mmol
        // 6 - mval
        case 12:
            if (data.length != 0) {
                value = parseInt(data, 16);
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

        // Rohwasserfaktor2 / Get_RohwasserFaktor2
        // 1 Byte
        case 63:
            if (data.length != 0) {
                value = parseInt(data, 16);
            } else value = data;
            break;

        // Dvgw Regeneration / GetDvgwTime
        // 1 Byte
        case 70:
            if (data.length != 0) {
                value = parseInt(data, 16);
            } else value = data;
            break;

        // Regenerationsverteilung / GetBesalzungsAbbruchVia
        // 1 Byte
        case 78:
            if (data.length != 0) {
                value = parseInt(data, 16);
            } else value = data;
            break;

        // Auslesen der Datentabelle / Get_Tableread
        // 1 byte subcode (32 byte response)
        // SUBCODE 0
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

        case 791:
            value = "";
            if (data.length == 66) {
                if (subIndex !== null) {
                    data = data.toString().split(':')[1];
                    switch (subIndex) {
                        // Gesamt Regenerationszahl
                        case 3031:
                            var tREGANZAHL_LO = data.slice(60, 62);
                            var tREGANZAHL_HI = data.slice(62, 64);
                            value = parseInt(tREGANZAHL_HI + '' + tREGANZAHL_LO, 16);
                            break;

                        // Statusflag Betrieb/Regeneration
                        case 0:
                            var flag = parseInt(data.slice(0, 2), 16);
                            var flagBinary = (+flag).toString(2);
                            var statusFlag = (flagBinary.length > 0) ? flagBinary[flagBinary.length - 1] : 0;
                            value = statusFlag;
                            break;
                    }
                }else{

                }
            } else value = 0;
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

        // Sollhaerte lesen / Get_SollHaerte
        // 4 Byte
        // low(Roh) | high(Roh) | low(Weich) | high(Weich)
        case 89:
            var lRoh = data.slice(0, 2);
            var hRoh = data.slice(2, 4);
            var lWeich = data.slice(4, 6);
            var hWeich = data.slice(6, 8);
            var rohHaerte = parseInt(hRoh + '' + lRoh, 16);
            var weichHaerte = parseInt(hWeich + '' + lWeich, 16);
            value = rohHaerte + ':' + weichHaerte;
            break;


        // Rohhaerte lesen / Get_Rohhaerte
        // 4 Byte
        // low(Roh) | high(Roh) | low(Weich) | high(Weich)
        case 90:
            var lRoh = data.slice(0, 2);
            var hRoh = data.slice(2, 4);
            var lWeich = data.slice(4, 6);
            var hWeich = data.slice(6, 8);
            var rohHaerte = parseInt(hRoh + '' + lRoh, 16);
            var weichHaerte = parseInt(hWeich + '' + lWeich, 16);
            value = rohHaerte + ':' + weichHaerte;
            break;


        // Ist Mischwasserhaerte lesen / Get_IstMischwasserHaerte
        // 4 Byte
        // low(Roh) | high(Roh) | low(Weich) | high(Weich)
        case 91:
            var lRoh = data.slice(0, 2);
            var hRoh = data.slice(2, 4);
            var lWeich = data.slice(4, 6);
            var hWeich = data.slice(6, 8);
            var rohHaerte = parseInt(hRoh + '' + lRoh, 16);
            var weichHaerte = parseInt(hWeich + '' + lWeich, 16);
            value = rohHaerte + ':' + weichHaerte;
            break;


        // fixierte Haerte lesen / Get_fixedRohHaerte
        // 4 Byte
        // low(Roh) | high(Roh) | low(Weich) | high(Weich)
        case 92:
            var lRoh = data.slice(0, 2);
            var hRoh = data.slice(2, 4);
            //var lWeich = data.slice(4, 6);
            //var hWeich = data.slice(6, 8);
            var rohHaerte = parseInt(hRoh + '' + lRoh, 16);
            //var weichHaerte = parseInt(hWeich + '' + lWeich, 16);
            value = rohHaerte;
            break;


        // UPS Status lesen / Get_UPS
        // 9 Byte
        //    1	8-Bit (unsigned)	UPS Version_LO
        //    2	8-Bit (unsigned)	UPS Version_HI
        //    3	8-Bit (flag)	UPS-STATUS  Bit7=LOW_BATT ; BIT6=Batterietest_laeuft; Bit5= 0; 	   Bit4=Wiederholender Test mit gesetztem LowBatt;
        //    Bit3=RelaisOn;	   Bit2=Batteriebetrieb;	    Bit1=24VOK; Bit0=Notstrommodul vorhanden
        //    4	8-Bit (unsigned)	UPS (letzte gemessene) Batteriespannung in Prozent
        //    5	8-Bit (unsigned)	UPS	(letzte gemessene) Batteriespannung in 0,1V (*10)
        //    6					8-Bit (unsigned)	UPS Aktuelle Batterielaufzeit in Sekunden (wird nach Batteriewechsel gelöscht)
        //    7					8-Bit (unsigned)	UPS Aktuelle Batterielaufzeit in Minuten	(wird nach Batteriewechsel gelöscht)
        //    8					8-Bit (unsigned)	UPS Aktuelle Batterielaufzeit in Stunden  (wird nach Batteriewechsel gelöscht)
        //    9					8-Bit (unsigned)	UPS BatterieReplace Counter Anzahl Batteriewechsel

        // index 93 Byte 3 - Batteriekapazitaet
        case 93:
            var kapazitaet = 0;
            var stunden = 0;
            var minuten = 0;
            var sekunden = 0;
            if(data.length == 10){
                kapazitaet = parseInt(data.slice(6,8),16);
                value = kapazitaet+"";
            } else if(data.length == 18){
                // i-soft 2019er
                kapazitaet = parseInt(data.slice(6,8),16);
                sekunden = parseInt(data.slice(10,12),16);
                minuten = parseInt(data.slice(12,14),16);
                stunden = parseInt(data.slice(14,16),16);
                value = kapazitaet +":"+ sekunden + ":" + minuten + ":" + stunden;
            } else {
                value = kapazitaet+"";
            }

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


        // Ausgabe des Salzreichweitemangel lesen / GET_Reichweitenmangel
        // 1 Byte
        case 95:
            if (data.length != 0) {
                value = parseInt(data, 16);
            } else value = data;
            break;

        case 127:
            if (subIndex !== null) {
                switch(subIndex){

                    //Fuellmodus
                    case 0:
                        if (data.length != 0) {
                            var d = data.slice(0, 2);
                            value = parseInt(d, 16);
                        } else value = data;
                        break;

                    //Anzahl Wartungen
                    //Byte 17 + 18
                    case 17:
                        //console.log(data);
                        if (data.length >= 38) {
                            var dHigh = data.slice(34, 36);
                            var dLow = data.slice(36, 38);
                            value = parseInt(dLow + "" + dHigh, 16);
                        }
                        break;

                    //Gesamtfuellmenge
                    //Byte 19 + 20 + 21 + 22
                    case 19:
                        if (data.length >= 46) {
                            var d1 = data.slice(38, 40);
                            var d2 = data.slice(40, 42);
                            var d3 = data.slice(42, 44);
                            var d4 = data.slice(44, 46);
                            value = parseInt(d4 + "" + d3 + "" + d2 + "" + d1, 16);
                        }
                        break;

                    case 2914:
                        if (data.length >= 64) {
                            var dHigh = data.slice(58, 60);
                            var dLow = data.slice(60, 62);
                            var intVal = parseInt(dLow + "" + dHigh, 16);
                            value = (+intVal).toString(2);
                            if(value.length < 16){
                                var c = 16 - value.length;
                                for(var i = 0; i < c; i++){
                                    value = "0" + value;
                                }
                            }
                        } else value = data;
                        break;

                    case 2915:

                        break;

                    //Fuelldruck
                    case 1:
                        if (data.length != 0) {
                            var d = data.slice(2, 4);
                            value = parseInt(d, 16);
                        } else value = data;
                        break;

                    //Anzahl Fuellzyklen
                    case 2:
                        if (data.length > 6) {
                            var d = data.slice(4, 6);
                            value = parseInt(d, 16);
                        } else value = data;
                        break;

                    //aktueller Leitwert
                    case 3:
                        if (data.length > 10) {
                            var d1 = data.slice(6, 8);
                            var d2 = data.slice(8, 10);
                            value = parseInt(d2 + "" + d1, 16);
                        }
                        break;

                    //Aktuelle Fuellmenge in Liter
                    case 7:
                        if (data.length > 16) {
                            var dHigh = data.slice(14, 16);
                            var dLow = data.slice(16, 18);
                            value = parseInt(dLow + "" + dHigh, 16);
                        }else value = data;
                        break;

                    case 11:
                        if(data.length > 24){
                            var d = data.slice(22,24);
                            value = parseInt(d,16);
                        }
                        break;

                    //Anzahl PURE Patronen
                    case 13:
                        if(data.length > 28){
                            var dHigh = data.slice(26, 28);
                            var dLow = data.slice(28, 30);
                            value = parseInt(dLow + "" + dHigh, 16);
                        }else value = data;
                        break;

                    //Anzahl SOFT Patronen
                    case 15:
                        if(data.length > 28){
                            var dHigh = data.slice(30, 32);
                            var dLow = data.slice(32, 34);
                            value = parseInt(dLow + "" + dHigh, 16);
                        }else value = data;
                        break;

                    case 23:
                        if(data.length > 54){
                            var d1 = data.slice(46, 48);
                            var d2 = data.slice(48, 50);
                            var d3 = data.slice(50, 52);
                            var d4 = data.slice(52, 54);
                            value = parseInt(d4 + "" + d3 + "" + d2 + "" + d1, 16);
                        }
                        break;
                }
            }
            break;

        //Get Limits Data
        case 129:
            if (subIndex !== null) {
                switch(subIndex){

                    //Sprache
                    case 0:
                        if(data.length >= 2){
                            var d = data.slice(0,2);
                            value = parseInt(d,16);
                        }
                        break;

                    //Einheit Wasserhaerte
                    case 1:
                        if(data.length >= 4){
                            var d = data.slice(2,4);
                            value = parseInt(d,16);
                        }
                        break;

                    /*//Rohwasserhaerte
                    case 2:
                        if(data.length >= 6){
                            var d = data.slice(4,6);
                            value = parseInt(d,16);
                        }
                        break;*/

                    //Patronentyp
                    case 3:
                        if(data.length >= 8){
                            var d = data.slice(6,8);
                            value = parseInt(d,16);
                        }else value = data;
                        break;

                    /*case 4:
                        if(data.length >= 10){
                            var d = data.slice(8,10);
                            value = parseInt(d,16);
                        }else value = data;
                        break;*/

                    //max anzahl fuellzyklen
                    case 5:
                        if(data.length >= 12){
                            var d = data.slice(10,12);
                            value = parseInt(d,16);
                        }
                        break;

                    //maximaler Fuelldruck
                    case 6:
                        if(data.length >= 14){
                            var d = data.slice(12,14);
                            value = parseInt(d,16);
                        }
                        break;

                    /*case 7:
                        if(data.length >= 16){
                            var d = data.slice(14,16);
                            value = parseInt(d,16);
                        }
                        break;*/

                    //Rohwasserhaerte
                    case 8:
                        if(data.length >= 18){
                            var d = data.slice(16,18);
                            value = parseInt(d,16);
                        }
                        break;

                    //maximaler Fuelldauer in Min
                    //Byte 10 + 11
                    case 10:
                        if(data.length >= 24){
                            var d1 = data.slice(20,22);
                            var d2 = data.slice(22,24);
                            value = parseInt(d2 + "" + d1,16);
                        }
                        break;

                    //maximaler Fuellmenge in Liter
                    //Byte 12 + 13
                    case 12:
                        if(data.length >= 28){
                            var d1 = data.slice(24,26);
                            var d2 = data.slice(26,28);
                            value = parseInt(d2 + "" + d1,16);
                        }
                        break;

                    case 14:
                        if(data.length >= 30){
                            var d = data.slice(28,30);
                            value = parseInt(d,16);
                        }
                        break;

                    /*case 15:
                        if(data.length >= 34){
                            var d1 = data.slice(30,32);
                            var d2 = data.slice(32,34);
                            value = parseInt(d2 + "" + d1, 16);
                        }
                        break;*/

                        //Max Leitwert
                        //Byte 18 + 19
                    case 18:
                        if(data.length >= 40){
                            var d1 = data.slice(36,38);
                            var d2 = data.slice(38,40);
                            value = parseInt(d2 + "" + d1,16);
                        }
                        break;

                    //Patronenkapazitaet nur bei pure frei & soft frei
                    //Byte 20 + 21 + 22 + 23
                    case 20:
                        if(data.length == 48){
                            var d1 = data.slice(40,42);
                            var d2 = data.slice(42,44);
                            var d3 = data.slice(44,46);
                            var d4 = data.slice(46,48);
                            value = parseInt(d4 + "" + d3 + "" + d2 + "" + d1, 16);
                        }
                        break;
                }
            }
            break;

        /*
                i-dos ueber Ewac
         */

        // GetStatusData
        case 137:
            if (subIndex !== null && data.length>0) {
                switch (subIndex) {
                    // Schaltungstyp
                    case 0:
                        value = 1;
                        try {
                            var byte = data.slice(0*2, 1*2);
                            switch (parseInt(byte, 16)) {
                                case 1: value = 3; break;
                                case 2: value = 4; break;
                                case 3: value = 10; break;
                                case 4: value = 25; break;
                                case 5: value = 60; break;
                            }
                        } catch (e) {}
                        break;
                    // Betriebsmodus
                    case 1:

                        break;
                    // Konzentrations-Modus
                    case 2:

                        break;
                    // Konzentration
                    case 3:
                        value = "minimal";
                        try {
                            var byte = data.slice(3*2, 4*2);
                            switch (parseInt(byte, 16)) {
                                case 1: value = "minimal"; break;
                                case 2: value = "normal"; break;
                                case 3: value = "maximal"; break;
                            }
                        } catch (e) {}
                        break;
                    // Current
                    case 4:

                        break;
                    // Fehlerregister
                    case 5:
                        var high = data.slice(5*2, 6*2);
                        var low = data.slice(6*2, 7*2);
                    // Statusregister
                    case 7:
                        if(typeof high === "undefined" && typeof low === "undefined") {
                            var high = data.slice(7*2, 8*2);
                            var low = data.slice(8*2, 9*2);
                        }
                        var int = parseInt(low + "" + high, 16);
                        value = (+int).toString(2);
                        var fill = "";
                        if(value.length < 16){
                            var bit = 16 - value.length;
                            for(var i = 0; i < bit; i++){
                                fill += "0";
                            }
                        }
                        value = (fill + value).split("").reverse().join("").indexOf("1");
                        if(value === -1)
                            value = false;
                        break;
                    // Temperatur
                    case 9:

                        break;
                    // unkompensierter Leitwert
                    case 11:

                        break;
                    // temperaturkompensierter Leitwert
                    case 13:

                        break;
                    // Dosiermenge/Funktionskontrolle
                    case 15:
                        value = 0;
                        try {
                            var byte_low = data.slice(15*2, 16*2);
                            var byte_high = data.slice(16*2, 17*2);
                            value = parseInt(byte_high + '' + byte_low, 16);
                        } catch (e) {}
                        break;
                    // Wasserdurchfluss
                    case 17:
                        value = 0;
                        try {
                            var byte_low = data.slice(17*2, 18*2);
                            var byte_high = data.slice(18*2, 19*2);
                            value = parseInt(byte_high + '' + byte_low, 16);
                        } catch (e) {}
                        break;
                    // Dosierrestmenge
                    case 19:
                        value = 0;
                        try {
                            var byte_low = data.slice(19*2, 20*2);
                            var byte_high = data.slice(20*2, 21*2);
                            value = parseInt(byte_high + '' + byte_low, 16);
                        } catch (e) {}
                        break;
                    // Wasserverbrauch
                    case 21:
                        value = 0;
                        try {
                            var byte1 = data.slice(21*2, 22*2);
                            var byte2 = data.slice(22*2, 23*2);
                            var byte3 = data.slice(23*2, 24*2);
                            var byte4 = data.slice(24*2, 25*2);
                            value = parseInt('' + byte4 + byte3 + byte2 + byte1,16);
                        } catch (e) {}
                        break;
                    // Total Wasserverbrauch
                    case 25:
                        value = 0;
                        try {
                            var byte1 = data.slice(25*2, 26*2);
                            var byte2 = data.slice(26*2, 27*2);
                            var byte3 = data.slice(27*2, 28*2);
                            var byte4 = data.slice(28*2, 29*2);
                            value = parseInt('' + byte4 + byte3 + byte2 + byte1,16);
                        } catch (e) {}
                        break;
                    default:
                        console.log("subindex lost");
                        break;
                }
            } else value = data;

            break;

        // GetMineralTyp
        case 146:
            if (data.length != 0) {
                value = {
                    "type": parseInt(data.slice(2, 4)),
                    "inhalt": parseInt(data.slice(0, 2))
                };
            } else value = "";
            break

        // dosiermenge statistic actual week
        case 147:
            if (data.length != 0) {
                /*var v1 = data.slice(0, 2);
                var v2 = data.slice(2, 4);
                var v3 = data.slice(4, 6);
                var v4 = data.slice(6, 8);
                value = parseInt(v4 + '' + v3 + '' + v2 + '' + v1, 16);*/
                value = parseInt(data.slice(0, 8), 16);
            } else value = "";
            break

        //-----------------------------------------------------------------------------------------//

        case 530:
            // Auslesen der Datentabelle
            // 1 byte subcode (32 byte response)
            // SUBCODE 0

            //data = "0:04000F28E00011000800140094029600000000000000000000001702B8005300";
            value = "";
            if (data.length == 66) {
                if (subIndex !== null) {

                    data = data.toString().split(':')[1];
                    switch (subIndex) {

                        case 0:
                            value = parseInt(data.slice(0, 2), 16);
                            break;
                        // tSOLL_HAERTE
                        case 8:
                            value = parseInt(data.slice(16, 18), 16);
                            break;

                        // tIST_HAERTE_SHOW_HAERTE2
                        case 9:
                            value = parseInt(data.slice(18, 20), 16);
                            break;

                        // tROHWASSER_HAERTE2
                        case 10:
                            value = parseInt(data.slice(20, 22), 16);
                            break;

                        // tLEITWERT
                        case 12:
                            var tLEITWERT_LO = parseInt(data.slice(24, 26), 16);
                            var tLEITWERT_HI = parseInt(data.slice(26, 28), 16);
                            value = (tLEITWERT_HI * 256) + tLEITWERT_LO;
                            break;

                        // tTEMPERATUR
                        case 14:
                            var tTEMPERATUR_LO = parseInt(data.slice(28, 30), 16);
                            var tTEMPERATUR_HI = parseInt(data.slice(30, 32), 16);
                            value = (tTEMPERATUR_HI * 256) + tTEMPERATUR_LO;
                            break;

                        // tRW_DURCHFLUSS
                        case 16:
                            var tRW_DURCHFLUSS_LO = parseInt(data.slice(32, 34), 16);
                            var tRW_DURCHFLUSS_HI = parseInt(data.slice(34, 36), 16);
                            value = (tRW_DURCHFLUSS_HI * 256) + tRW_DURCHFLUSS_LO;
                            break;

                        // tWW_DURCHFLUSS
                        case 18:
                            var tWW_DURCHFLUSS_LO = parseInt(data.slice(36, 38), 16);
                            var tWW_DURCHFLUSS_HI = parseInt(data.slice(38, 40), 16);
                            value = (tWW_DURCHFLUSS_HI * 256) + tWW_DURCHFLUSS_LO;
                            break;

                        // tROHWASSER_HAERTE1
                        case 26:
                            value = parseInt(data.slice(52, 54), 16);
                            break;
                    }
                } else {
                    var tERROR_BYTE = parseInt(data.toString().slice(0, 2), 16);
                    var tNULL_BYTE = parseInt(data.slice(2, 4), 16);
                    var tINITIAL_STATUS = parseInt(data.slice(4, 6), 16);
                    var tMOTOR_FLAG = parseInt(data.slice(6, 8), 16);
                    var tICON_BYTE = parseInt(data.slice(8, 10), 16);
                    var tICON_BYTE2 = parseInt(data.slice(10, 12), 16);
                    var tsecond_flag = parseInt(data.slice(12, 14), 16);
                    var tWS_STATUS_FLAG = parseInt(data.slice(14, 16), 16);
                    var tSOLL_HAERTE = parseInt(data.slice(16, 18), 16);
                    var tIST_HAERTE_SHOW = parseInt(data.slice(18, 20), 16);
                    var tROHWASSER_HAERTE2 = parseInt(data.slice(20, 22), 16);
                    var tKorrektur_Haerte = parseInt(data.slice(22, 24), 16);
                    var tLEITWERT_LO = parseInt(data.slice(24, 26), 16);
                    var tLEITWERT_HI = parseInt(data.slice(26, 28), 16);
                    var ttemperatur_lo = parseInt(data.slice(28, 30), 16);
                    var ttemperatur_HI = parseInt(data.slice(30, 32), 16);

                    var tRW_DURCHFLUSS_LO = parseInt(data.slice(32, 34), 16);
                    var tRW_DURCHFLUSS_HI = parseInt(data.slice(34, 36), 16);
                    var tWW_DURCHFLUSS_LO = parseInt(data.slice(36, 38), 16);
                    var tWW_DURCHFLUSS_HI = parseInt(data.slice(38, 40), 16);
                    //var ??? = parseInt(data.slice(40,42), 16);
                    //var ??? = parseInt(data.slice(42,44), 16);
                    //var ??? = parseInt(data.slice(44,46), 16);
                    //var ??? = parseInt(data.slice(46,48), 16);
                    var tRohwasser_schnitt_lo = parseInt(data.slice(48, 50), 16);
                    var tRohwasser_schnitt_hi = parseInt(data.slice(50, 52), 16);
                    var tROHWASSER_HAERTE1 = parseInt(data.slice(52, 54), 16);
                    //var ??? = parseInt(data.slice(54,56), 16);
                    var tCVA = parseInt(data.slice(56, 58), 16);
                    var tDIP1 = parseInt(data.slice(58, 60), 16);
                    var tVSV_WINKEL_LO = parseInt(data.slice(60, 62), 16);
                    var tVSV_WINKEL_HI = parseInt(data.slice(62, 64), 16);


                    value += "tERROR_BYTE : " + tERROR_BYTE + "<br>";
                    value += "tNULL_BYTE : " + tNULL_BYTE + "<br>";
                    value += "tINITIAL_STATUS : " + tINITIAL_STATUS + "<br>";
                    value += "tMOTOR_FLAG : " + tMOTOR_FLAG + " - " + getBitmask(tMOTOR_FLAG) + "<br>";
                    value += "tICON_BYTE : " + tICON_BYTE + " - " + getBitmask(tICON_BYTE) + "<br>";
                    value += "tICON_BYTE2 : " + tICON_BYTE2 + " - " + getBitmask(tICON_BYTE2) + "<br>";
                    value += "tsecond_flag : " + tsecond_flag + "<br>";
                    value += "tWS_STATUS_FLAG : " + tWS_STATUS_FLAG + "<br>";
                    value += "tSOLL_HAERTE : " + tSOLL_HAERTE + "<br>";
                    value += "tIST_HAERTE_SHOW : " + tIST_HAERTE_SHOW + "<br>";
                    value += "tROHWASSER_HAERTE2 : " + tROHWASSER_HAERTE2 + "<br>";
                    value += "tKorrektur_Haerte : " + tKorrektur_Haerte + "<br>";
                    value += "tLEITWERT_LO : " + tLEITWERT_LO + "<br>";
                    value += "tLEITWERT_HI : " + tLEITWERT_HI + "<br>";
                    value += "ttemperatur_lo : " + ttemperatur_lo + "<br>";
                    value += "ttemperatur_HI : " + ttemperatur_HI + "<br>";
                    value += "tRW_DURCHFLUSS_LO : " + tRW_DURCHFLUSS_LO + "<br>";
                    value += "tRW_DURCHFLUSS_HI : " + tRW_DURCHFLUSS_HI + "<br>";
                    value += "tWW_DURCHFLUSS_LO : " + tWW_DURCHFLUSS_LO + "<br>";
                    value += "tWW_DURCHFLUSS_HI : " + tWW_DURCHFLUSS_HI + "<br>";
                    value += "tRohwasser_schnitt_lo : " + tRohwasser_schnitt_lo + "<br>";
                    value += "tRohwasser_schnitt_hi : " + tRohwasser_schnitt_hi + "<br>";
                    value += "tROHWASSER_HAERTE1 : " + tROHWASSER_HAERTE1 + "<br>";
                    value += "tCVA : " + tCVA + "<br>";
                    value += "tDIP1 : " + tDIP1 + "<br>";
                    value += "tVSV_WINKEL_LO : " + tVSV_WINKEL_LO + "<br>";
                    value += "tVSV_WINKEL_HI : " + tVSV_WINKEL_HI + "<br>";
                }
            } else
                value = "";

            break;

        case 531:
            // Auslesen der Datentabelle
            // 1 byte subcode (32 byte response)
            // SUBCODE 1

            value = "";
            if (data.length == 66) {
                if (subIndex !== null) {

                    var d = data.split(':')[1];

                    switch (subIndex) {

                        // tSTATUS_FLAG
                        case 0:
                            x = parseInt(d.slice(0, 2), 16);
                            value = (+x).toString(2);
                            break;

                        // tSALZMANGEL_REG_COUNTER
                        case 29:
                            value = parseInt(d.slice(58, 60), 16);
                            break;

                        // tSTATUS_FLAG
                        case 30:
                            var tREGANZAHL_LO = parseInt(d.slice(60, 62), 16);
                            var tREGANZAHL_HI = parseInt(d.slice(62, 64), 16);

                            value = (tREGANZAHL_HI * 256) + tREGANZAHL_LO;
                            break;
                    }
                } else {
                    var d = data.split(':')[1];

                    var tSTATUS_FLAG = parseInt(d.toString().slice(0, 2), 16);
                    var tREGENERATION_STEP = parseInt(d.slice(2, 4), 16);
                    var tCHLOR_MINUTEN_TIMER = parseInt(d.slice(4, 6), 16);
                    //var NULL = parseInt(d.slice(6,8), 16);
                    var tBECHLORUNGS_ABSTAND = parseInt(d.slice(8, 10), 16);
                    var tDVGW_TIMER = parseInt(d.slice(10, 12), 16);
                    var tWW_LITER_LO = parseInt(d.slice(12, 14), 16);
                    var tWW_LITER_HI = parseInt(d.slice(14, 16), 16);
                    var tHALL2_Sync_Counter = parseInt(d.slice(16, 18), 16);
                    var tHALL2_SYNC_MIRROR = parseInt(d.slice(18, 20), 16);
                    var tSALZ_TIMER_LEFT_LO = parseInt(d.slice(20, 22), 16);
                    var tSALZ_TIMER_LEFT_HI = parseInt(d.slice(22, 24), 16);
                    var tSALZ_TIMER_RECHTS_LO = parseInt(d.slice(24, 26), 16);
                    var tSALZ_TIMER_RECHTS_HI = parseInt(d.slice(26, 28), 16);
                    var tBESALZUNGSTIMER_LO = parseInt(d.slice(28, 30), 16);
                    var tBESALZUNGSTIMER_HI = parseInt(d.slice(30, 32), 16);

                    var tSALZ_UP_TIMER_LO = parseInt(d.toString().slice(32, 34), 16);
                    var tSALZ_UP_TIMER_HI = parseInt(d.toString().slice(34, 36), 16);
                    var tFUELL_ZEIT_LO = parseInt(d.toString().slice(36, 38), 16);
                    var tFUELL_ZEIT_HI = parseInt(d.toString().slice(38, 40), 16);
                    var tR_SEKUNDEN_TIMER = parseInt(d.toString().slice(40, 42), 16);
                    var tR_MINUTEN_TIMER = parseInt(d.toString().slice(42, 44), 16);
                    var tANA_CHLOR_LO = parseInt(d.toString().slice(44, 46), 16);
                    var tANA_CHLOR_HI = parseInt(d.toString().slice(46, 48), 16);

                    //var ??? = parseInt(d.slice(48,50), 16);
                    //var ??? = parseInt(d.slice(50,52), 16);

                    var tEH_WINKEL_LO = parseInt(d.slice(52, 54), 16);
                    var tEH_WINKEL_HI = parseInt(d.slice(54, 56), 16);
                    var tREGANZAHL_SALZ = parseInt(d.slice(56, 58), 16);
                    var tSALZMANGEL_REG_COUNTER = parseInt(d.slice(58, 60), 16);
                    var tREGANZAHL_LO = parseInt(d.slice(60, 62), 16);
                    var tREGANZAHL_HI = parseInt(d.slice(62, 64), 16);

                    value += "tSTATUS_FLAG : " + tSTATUS_FLAG + "<br>";
                    value += "tREGENERATION_STEP : " + tREGENERATION_STEP + "<br>";
                    value += "tCHLOR_MINUTEN_TIMER : " + tCHLOR_MINUTEN_TIMER + "<br>";
                    value += "tBECHLORUNGS_ABSTAND : " + tBECHLORUNGS_ABSTAND + "<br>";
                    value += "tDVGW_TIMER : " + tDVGW_TIMER + "<br>";
                    value += "tWW_LITER_LO : " + tWW_LITER_LO + "<br>";
                    value += "tWW_LITER_HI : " + tWW_LITER_HI + "<br>";
                    value += "tHALL2_Sync_Counter : " + tHALL2_Sync_Counter + "<br>";
                    value += "tHALL2_SYNC_MIRROR : " + tHALL2_SYNC_MIRROR + "<br>";
                    value += "tSALZ_TIMER_LEFT_LO : " + tSALZ_TIMER_LEFT_LO + "<br>";
                    value += "tSALZ_TIMER_LEFT_HI : " + tSALZ_TIMER_LEFT_HI + "<br>";
                    value += "tSALZ_TIMER_RECHTS_LO : " + tSALZ_TIMER_RECHTS_LO + "<br>";
                    value += "tSALZ_TIMER_RECHTS_HI : " + tSALZ_TIMER_RECHTS_HI + "<br>";
                    value += "tBESALZUNGSTIMER_LO : " + tBESALZUNGSTIMER_LO + "<br>";
                    value += "tBESALZUNGSTIMER_HI : " + tBESALZUNGSTIMER_HI + "<br>";
                    value += "tSALZ_UP_TIMER_LO : " + tSALZ_UP_TIMER_LO + "<br>";
                    value += "tSALZ_UP_TIMER_HI : " + tSALZ_UP_TIMER_HI + "<br>";
                    value += "tFUELL_ZEIT_LO : " + tFUELL_ZEIT_LO + "<br>";
                    value += "tFUELL_ZEIT_HI : " + tFUELL_ZEIT_HI + "<br>";
                    value += "tR_SEKUNDEN_TIMER : " + tR_SEKUNDEN_TIMER + "<br>";
                    value += "tR_MINUTEN_TIMER : " + tR_MINUTEN_TIMER + "<br>";
                    value += "tANA_CHLOR_LO : " + tANA_CHLOR_LO + "<br>";
                    value += "tANA_CHLOR_HI : " + tANA_CHLOR_HI + "<br>";
                    value += "tEH_WINKEL_LO : " + tEH_WINKEL_LO + "<br>";
                    value += "tEH_WINKEL_HI : " + tEH_WINKEL_HI + "<br>";
                    value += "tREGANZAHL_SALZ : " + tREGANZAHL_SALZ + "<br>";
                    value += "tSALZMANGEL_REG_COUNTER : " + tSALZMANGEL_REG_COUNTER + "<br>";
                    value += "tREGANZAHL_LO : " + tREGANZAHL_LO + "<br>";
                    value += "tREGANZAHL_HI : " + tREGANZAHL_HI + "<br>";
                }
            }
            //value = v;
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
