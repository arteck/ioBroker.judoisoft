/**
 *
 *      ioBroker judoisoft Adapter
 *
 *      (c) 2014-2021 arteck <arteck@outlook.com>
 *
 *      MIT License
 *
 */
'use strict';

const judoConv = require('./lib/dataConverter');
const utils = require('@iobroker/adapter-core');
const axios = require('axios');
const https = require('https');
const md5 = require('md5');

let interval = 0;
let requestTimeout = null;


axios.defaults.timeout = 1000 * 10;   // timeout 10 sec

// At request level
const agent = new https.Agent({  
    rejectUnauthorized: false
});


let baseUrl = "";
let _tokenData;
let _pauseValveState = false;
let _pauseStandBy = false;
let _serialnumber;
let _da;
let _dt;

class judoisoftControll extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'judoisoft',
        });
        this.on('ready', this.onReady.bind(this));
        //this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        //  this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        this.setState('info.connection', false, true);

        await this.initialization();
        await this.create_state();
        _tokenData = await this.getTokenFirst();

        if (this.config.cloud) {
            this.getInfosCloud();
        } else {
            await this.getInfoStaticLocal();
            this.getInfosLocal();
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            if (requestTimeout) clearTimeout(requestTimeout);

            this.log.info('cleaned everything up...');
            this.setState('info.connection', false, true);
            callback();
        } catch (e) {
            callback();
        }
    }


    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {

        if (state) {
            this.log.debug(`--> stateID ${id} changed: ${state.val} (ack = ${state.ack})`);
            
            let tmp = id.split('.');
            let command = tmp.pop();
            
            if (state && !state.ack) {
                if (this.config.cloud) {
                    this.setCommandStateCloud(command, state.val);
                } else {
                    this.setCommandStateLocal(command, state.val);
                }
            }
    
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    async getInfoStaticLocal() {
        this.log.debug("get Information Static Local");    
        
         try {
             const soft = await axios.get(baseUrl + "version&command=software%20version&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });   //SoftwareVersion
             this.setState("SoftwareVersion", soft.data.data, true);            
         } catch (err) {
            this.log.error('SoftwareVersion ERROR ');
         }    
        
         try {
             const hard = await axios.get(baseUrl + "version&command=hardware%20version&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });   //HardwareVersion
             this.setState("HardwareVersion", hard.data.data, true);
         } catch (err) {
            this.log.error('HardwareVersion ERROR ');
         }   
        
         try {  
             const instDat = await axios.get(baseUrl + "contract&command=init%20date&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });   //InstallationDate
         //    const inst = this.timeConverter(Number(instDat.data.data));
             const inst = new Date(Number(instDat.data.data) * 1000);
             this.setState("InstallationDate", inst, true);       
         } catch (err) {
            this.log.error('InstallationDate ERROR ');
         }       
        
         try {
             const servDat = await axios.get(baseUrl + "contract&command=service%20date&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });   //ServiceDate
          //   const serv = this.timeConverter(Number(servDat.data.data));
             const serv = new Date(Number(servDat.data.data) * 1000);
             this.setState("ServiceDate", serv, true);                       
         } catch (err) {
            this.log.error('ServiceDate ERROR ');
         }                             
    }

    async getInfosCloud() {
        this.log.debug("get Consumption data Cloud");

        try {
            // check data
            const urlGet = baseUrl + "?token=" + _tokenData + "&group=register&command=get%20device%20data";

            let conResult = await axios.get(urlGet, { httpsAgent: agent });

            if (conResult.status = 200) {  // der wird evtl. nicht gebraucht
                if (conResult.data.status == 'online' || conResult.data.status == 'ok') {
                    this.log.debug("all fine " + conResult.data);
                } else {
                    this.log.info("reconnect " + Date.now());
                    _tokenData = await this.getTokenFirst();
                    conResult = await axios.get(baseUrl + "?token=" + _tokenData + "&group=register&command=get%20device%20data", {httpsAgent: agent});
                }

                let result;

                _serialnumber = conResult.data.data[0].serialnumber;
                await this.setState("SerialNumber", _serialnumber, true);
                this.log.debug("-> SerialNumber");

                await this.setState("SoftwareVersion", judoConv.getInValue(conResult.data.data[0].data[0].data, '1'), true);
                this.log.debug("-> SoftwareVersion");
                await this.setState("HardwareVersion", judoConv.getInValue(conResult.data.data[0].data[0].data, '2'), true);
                this.log.debug("-> HardwareVersion");

                _da = conResult.data.data[0].data[0].da;
                this.log.debug("-> _da " + _da);
                _dt = conResult.data.data[0].data[0].dt;
                this.log.debug("-> _dt " + _dt);

                // InstallationDate
                result = judoConv.getInValue(conResult.data.data[0].data[0].data, '6');
//            result = daten.data[0].installation_date;
                this.log.debug("-> InstallationDate " + result);
                await this.setState("InstallationDate", result, true);


                // service
                result = judoConv.getInValue(conResult.data.data[0].data[0].data, '6').split(':')[0];
                await this.setState("ServiceDays", result, true);
                this.log.debug("-> ServiceDays " + result);

                await this.setState("Connection status", conResult.data.data[0].status, true);

                //Maintenance
                result = judoConv.getInValue(conResult.data.data[0].data[0].data, '7').split(':')[0];
                await this.setState(`Maintenance`, result, true);
                this.log.debug("-> Maintenance " + result);

                //WaterTotal
                result = judoConv.getInValue(conResult.data.data[0].data[0].data, '8');
                await this.setState(`WaterTotal`, result, true);

                result = judoConv.getInValue(conResult.data.data[0].data[0].data, '9');
                await this.setState(`WaterTotalOut`, result, true);
                this.log.debug("-> WaterTotal");

                //SaltRange
                result = judoConv.getInValue(conResult.data.data[0].data[0].data, '94');
                let salzstand_rounded = 0;
                let reichweite = 0;
                let salzstand = 0;

                if (result.indexOf(':') > -1) {
                    reichweite = Math.round(result.split(':')[1]);
                    salzstand = result.split(':')[0] / 1000;
                    salzstand_rounded = parseInt(5 * Math.ceil(salzstand / 5));

                    if (reichweite > 1) {
                        await this.setState(`SaltRange`, Number(reichweite), true);
                    } else {
                        await this.setState(`SaltRange`, Number(salzstand_rounded), true);
                    }
                }

                this.log.debug("-> SaltRange");

                // NaturalHardness
                //    result = parseInt(judoConv.getInValue(conResult.data.data[0].data[0].data, '790_26')/2)+2;
                result = 0;
                await this.setState(`NaturalHardness`, Number(result), true);
                this.log.debug("-> NaturalHardness");

                //ResidualHardness
                result = judoConv.getInValue(conResult.data.data[0].data[0].data, '790_8');
                await this.setState(`ResidualHardness`, Number(result), true);
                this.log.debug("-> ResidualHardness");

                //SaltQuantity
                let sq = salzstand_rounded * 100 / 50;
                if (sq > 100) sq = 100;

                await this.setState(`SaltQuantity`, Number(sq), true);
                this.log.debug("-> SaltQuantity");

                //WaterCurrent
                result = judoConv.getInValue(conResult.data.data[0].data[0].data, '790_1617');
                await this.setState(`WaterCurrent`, Number(result), true);
                this.log.debug("-> WaterCurrent");

                //StandByValue
                result = judoConv.getInValue(conResult.data.data[0].data[0].data, '792_9');
                await this.setState(`StandByValue`, Number(result), true);
                this.log.debug("-> StandByValue" + result);

                //Battery
                result = judoConv.getInValue(conResult.data.data[0].data[0].data, '93');
                if (result && result.toString().indexOf(":") > -1) {
                    let batt = result.split(":");
                    await this.setState(`Battery`, batt[0], true);
                    this.log.debug("-> Battery" + batt[0]);
                }

                await this.setState("lastInfoUpdate", Date.now(), true);

                requestTimeout = setTimeout(async () => {
                    this.getInfosCloud();
                }, interval);
            }
        } catch (err) {
            this.setState('info.connection', false, true);
            this.log.error('getInfosCloud ERROR ');
        }
    }

    async getInfosLocal() {
        this.log.debug("get Consumption data Local");

        // check loged in
        let stats = await axios.get(baseUrl + "register&command=plumber%20address&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
        
        if (stats.data.status == 'error') {
            this.log.info("reconnect " + Date.now()); 
            _tokenData = await this.getTokenFirst();
        } 
     
        let result;
        
        try {
            if (_tokenData) {   
                                
                //WaterCurrent
                result = await axios.get(baseUrl + "consumption&command=water%20current&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
                let splWassCur = result.data.data.split(" ");
                await this.setState(`WaterCurrent`, Number(splWassCur[0]), true);
                await this.setState(`WaterCurrentOut`, Number(splWassCur[1]), true);                               
                this.log.debug("-> WaterCurrent");
                               
                //ResidualHardness
                result = await axios.get(baseUrl + "settings&command=residual%20hardness&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
                await this.setState(`ResidualHardness`, Number(result.data.data), true);
                this.log.debug("-> ResidualHardness");                                                
                
                //SaltRange
                result = await axios.get(baseUrl + "consumption&command=salt%20range&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
                await this.setState(`SaltRange`, Number(result.data.data), true);

                this.log.debug("-> SaltRange");
                
                //SaltQuantity
                result = await axios.get(baseUrl + "consumption&command=salt%20quantity&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
                let sq = result.data.data;
                sq = Math.round((sq/50000)*100);
                    
                await this.setState(`SaltQuantity`, Number(sq), true);
                this.log.debug("-> SaltQuantity");
                
                //WaterAverage
                result = await axios.get(baseUrl + "consumption&command=water%20average&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
                await this.setState(`WaterAverage`, Number(result.data.data), true);
                this.log.debug("-> WaterAverage");

                //NaturalHardness
                result = await axios.get(baseUrl + "info&command=natural%20hardness&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
                await this.setState(`NaturalHardness`, Number(result.data.data), true);
                this.log.debug("-> NaturalHardness");
                
                //FlowRate
                result = await axios.get(baseUrl + "waterstop&command=flow%20rate&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
                await this.setState(`FlowRate`, Number(result.data.data), true);
                this.log.debug("-> FlowRate");

                //Quantity
                result = await axios.get(baseUrl + "waterstop&command=quantity&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });                             
                await this.setState(`Quantity`, Number(result.data.data), true);
                this.log.debug("-> Quantity");
                
                //WaterTotal
                result = await axios.get(baseUrl + "consumption&command=water%20total&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });             
                
                let splWassTot = result.data.data.split(" ");
                await this.setState(`WaterTotal`, splWassTot[1] / 1000, true);
                await this.setState(`WaterTotalOut`, splWassTot[2] / 1000, true);
                this.log.debug("-> WaterTotaal " + result.data.data);
                
                 //WaterYearly
                result = await axios.get(baseUrl + "consumption&command=water%20yearly&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
                let splWassJahr = result.data.data.split(" ");
                for (var b = 1; b < 13; b++) {
                   let a = b;
                   if (a < 10) {
                     a = '0' + a;
                   }

                   let monat = splWassJahr[b];

                   this.log.debug(`WaterYearly.${a} ${monat} ${splWassJahr[b]}`);

                   if (monat > 0) {
                      monat = monat / 1000;
                   } else {
                      monat = 0;
                   }

                   await this.setState(`WaterYearly.${a}`, monat, true);
                }
                this.log.debug("-> WaterYearly");

                if (!_pauseStandBy) {
                    //StandBy
                    result = await axios.get(baseUrl + "waterstop&command=standby&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
                    await this.setState(`StandByValue`, Number(result.data.data), true);                                   
                    this.log.debug("-> StandBy");
                    _pauseStandBy = false;
                }
                
                if (!_pauseValveState) {
                    //ValveState
                    result = await axios.get(baseUrl + "waterstop&command=valve&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
                    await this.setState(`WaterStopStatus`, result.data.data, true);                

                    if (result.data.data == 'opened') {
                        await this.setState(`WaterStop`, false, true);
                    } else {
                        await this.setState(`WaterStop`, true, true);
                    }

                    this.log.debug("-> ValveState");
                }
                await this.setState("lastInfoUpdate", Date.now(), true);   
                
            } // if _tokenData
            
            requestTimeout = setTimeout(async () => {
                this.getInfosLocal();
            }, interval);

        } catch (err) {
            this.setState('info.connection', false, true);
            this.log.error('getInfos ERROR ');
        }
    }

    async setCommandStateCloud(command, state) {
        switch (command) {  
            case 'Regeneration':
                this.log.debug("set Regeneration Cloud" + state);
                await axios.get(baseUrl + "?token=" + _tokenData + "&group=register&command=write%20data&serial_number=" + _serialnumber + "&dt=" + _dt + "&index=65&data=&da=" + _da + "&role=customer" , { httpsAgent: agent });                                  
                break;
            case 'WaterStop':
                this.log.debug("set WaterStop Cloud" + state);
                _pauseValveState = true;     // fÃ¼r getInfo
                
                if (state) {                            
                    const val = await axios.get(baseUrl + "?token=" + _tokenData + "&group=register&command=write%20data&serial_number=" + _serialnumber + "&dt=" + _dt + "&index=72&data=&da=" + _da + "&role=customer" , { httpsAgent: agent });                                  
                    await this.setState("WaterStopStatus", val.data.status, true);
                } else {
                    const val = await axios.get(baseUrl + "?token=" + _tokenData + "&group=register&command=write%20data&serial_number=" + _serialnumber + "&dt=" + _dt + "&index=73&data=&da=" + _da + "&role=customer" , { httpsAgent: agent });                                  
                    await this.setState("WaterStopStatus", val.data.status, true);
                }
                _pauseValveState = false;

                break;  
            case 'StandBy':
                this.log.debug("set StandBy Cloud" + state);
                _pauseStandBy = true;    // fÃ¼r getInfo
                if (state) {  
                    const val = await axios.get(baseUrl + "?token=" + _tokenData + "&group=register&command=write%20data&serial_number=" + _serialnumber + "&dt=" + _dt + "&index=171&data=&da=" + _da + "&role=customer" , { httpsAgent: agent });                                  
                } else {
                    const val = await axios.get(baseUrl + "?token=" + _tokenData + "&group=register&command=write%20data&serial_number=" + _serialnumber + "&dt=" + _dt + "&index=73&data=&da=" + _da + "&role=customer" , { httpsAgent: agent });                                  
                }               
                _pauseStandBy = false;
                
                break; 
            case 'ResidualHardness':
                this.log.debug("set ResidualHardness Cloud" + state);
                const val = await axios.get(baseUrl + "?token=" + _tokenData + "&group=register&command=write%20data&serial_number=" + _serialnumber + "&dt=" + _dt + "&index=60&data=" + state + "&da=" + _da + "&role=customer" , { httpsAgent: agent });                                  
                break;                
            default:

        }

    }

    async setCommandStateLocal(command, state) {
        switch (command) {             
            case 'Regeneration':
                this.log.debug("set Regeneration Local" + state);
                await axios.get(baseUrl + "settings&command=regeneration&msgnumber=1&token=" + _tokenData + "&parameter=start", { httpsAgent: agent });   
                break;
            case 'WaterStop':
                this.log.debug("set WaterStop Local" + state);
                _pauseValveState = true;     // fÃ¼r getInfo
                if (state) {                            
                    const val = await axios.get(baseUrl + "waterstop&command=valve&msgnumber=1&token=" + _tokenData + "&parameter=close", { httpsAgent: agent });
                    await this.setState("WaterStopStatus", val.data.parameter, true);
                } else {
                    const val = await axios.get(baseUrl + "waterstop&command=valve&msgnumber=1&token=" + _tokenData + "&parameter=open", { httpsAgent: agent });
                    await this.setState("WaterStopStatus", val.data.parameter, true);
                }
                _pauseValveState = false;

                break;   
            case 'StandBy':
                this.log.debug("set StandBy Local" + state);
                _pauseStandBy = true;    // fÃ¼r getInfo
                if (state) {  
                    await axios.get(baseUrl + "waterstop&command=standby&msgnumber=1&token=" + _tokenData + '&parameter=start', { httpsAgent: agent }); 
                } else {
                    await axios.get(baseUrl + "waterstop&command=standby&msgnumber=1&token=" + _tokenData + '&parameter=stop', { httpsAgent: agent }); 
                }
                //StandByValue
                const valSt = await axios.get(baseUrl + "waterstop&command=standby&msgnumber=1&token=" + _tokenData, { httpsAgent: agent });
                await this.setState(`StandByValue`, Number(valSt.data.data), true);
                _pauseStandBy = false;
                
                break; 
             case 'ResidualHardness':
                this.log.debug("set ResidualHardness Local" + state);
                await axios.get(baseUrl + "settings&command=residual%20hardness&msgnumber=1&token=" + _tokenData + '&parameter=' + state, { httpsAgent: agent });                                 
                break;
             default:

        }
   }
    
   async getTokenFirst() {

       let statusURL = "";

       if (this.config.cloud) {
           statusURL = baseUrl + "?group=register&command=login&msgnumber=1&name=login&user=" + this.config.user + "&password=" + md5(this.config.password) + "&nohash=Service&role=customer";
           this.log.debug("get statusURL for Cloud");
       } else {
           statusURL = baseUrl + "register&command=login&msgnumber=1&name=login&user=" + this.config.user + "&password=" + this.config.password + "&role=customer";
           this.log.debug("get statusURL for local");
       }

       let token;
       
       try {
            const tokenObject = await axios.get(statusURL, { httpsAgent: agent });

            if (tokenObject.status = 200) {  // der wird evtl. nicht gebraucht
                if (tokenObject.data.status == 'online' || tokenObject.data.status == 'ok') {

                    token = tokenObject.data.token;

                    await this.setState("token", token, true);

                    //Serial only local
                    if (!this.config.cloud) {
                        const serResult = await axios.get(baseUrl + "register&command=show&msgnumber=2&token=" + token, {httpsAgent: agent});

                        this.log.debug("getSerialnumber : " + JSON.stringify(serResult.data));

                        const wtuType = serResult.data.data[0]["wtuType"];
                        const serialN = serResult.data.data[0]["serial number"];

                        await this.setState("wtuType", wtuType, true);
                        this.log.debug("getwtuType " + wtuType); 
                        
                        await this.setState("SerialNumber", serialN, true);
                        this.log.debug("getserialN " + serialN);
                        
                        //Connect
                        const conResult = await axios.get(baseUrl + "register&command=connect&msgnumber=1&token=" + token + "&parameter=" + wtuType + "&serial%20number=" + serialN, {httpsAgent: agent});
                        this.log.debug("connect Result: " + JSON.stringify(conResult.data));

                        await this.setState("Connection status", conResult.data.status, true);
                    }
                } else {
                    token = null;
                }
                return token;
            } else {
                this.setState('info.connection', false, false);
                this.setState("Connection status", "ERROR", true);
                this.log.error("Check Login data (user:psw)"); 
                return null;
            }            

       } catch (err) {
           this.setState("Connection status", "ERROR", true);
           this.setState('info.connection', false, false);
           return null;
       }
   }

   async create_state() {
        this.log.debug(`create state`);

        await this.extendObjectAsync(`token`, {
            type: 'state',
            common: {
                name: `token`,
                type: 'string',
                read: true,
                write: false,
                role: 'info'
            },
            native: { },
        });

        await this.extendObjectAsync(`lastInfoUpdate`, {
            type: 'state',
            common: {
                name: 'Date/Time of last information update',
                type: 'number',
                role: 'value.time',
                read: true,
                write: false
            },
            native: { },
        });
        
        if (this.config.cloud) {
            await this.extendObjectAsync(`ServiceDays`, {
                type: 'state',
                common: {
                    name: `ServiceDays`,
                    type: 'number',
                    role: 'info',
                    read: true,
                    write: false
                },
                native: {},
            });
        } else {
            await this.extendObjectAsync(`ServiceDate`, {
                type: 'state',
                common: {
                    name: `ServiceDate`,
                    type: 'number',
                    role: 'value.time',
                    read: true,
                    write: false
                },
                native: {},
            });
        }

         await this.extendObjectAsync(`InstallationDate`, {
            type: 'state',
            common: {
                name: `InstallationDate`,
                type: 'number',
                role: 'value.time',
                read: true,
                write: false
            },
            native: {},
        });
       
        if (this.config.cloud) {
            await this.extendObjectAsync(`Battery`, {
                type: 'state',
                common: {
                    name: `Battery`,
                    type: 'number',
                    read: true,
                    write: false,
                    def: 0,
                    role: 'info',
                    unit: '%'
                },
                native: {},
            });
        }
       
       
        if (this.config.cloud) {
            await this.extendObjectAsync(`WaterCurrent`, {
                type: 'state',
                common: {
                    name: `WaterCurrent`,
                    type: 'number',
                    read: true,
                    write: false,
                    def: 0,
                    role: 'info',
                    unit: 'l/h'
                },
                native: {},
            });
            await this.extendObjectAsync(`WaterCurrentOut`, {
                type: 'state',
                common: {
                    name: `WaterCurrentOut`,
                    type: 'number',
                    read: true,
                    write: false,
                    def: 0,
                    role: 'info',
                    unit: 'l/h'
                },
                native: {},
            });
        } else {
             await this.extendObjectAsync(`WaterCurrent`, {
                type: 'state',
                common: {
                    name: `WaterCurrent`,
                    type: 'number',
                    read: true,
                    write: false,
                    def: 0,
                    role: 'info',
                    unit: 'l'
                },
                native: {},
            });
            await this.extendObjectAsync(`WaterCurrentOut`, {
                type: 'state',
                common: {
                    name: `WaterCurrentOut`,
                    type: 'number',
                    read: true,
                    write: false,
                    def: 0,
                    role: 'info',
                    unit: 'l'
                },
                native: {},
            });
        }
        
       // not in the cloud
       if (!this.config.cloud) {
            await this.extendObjectAsync(`WaterYearly`, {
                type: 'channel',
                common: {
                    name: `WaterYearly`,
                },
                native: {},
            });

           for (var b = 1; b < 13; b++) {
               if (b < 10) {
                 b = '0' + b;
               }
               await this.extendObjectAsync(`WaterYearly.${b}`, {
                    type: 'state',
                    common: {
                        name: `${b}`,
                        type: 'number',
                        read: true,
                        write: false,
                        def: 0,
                        role: 'info',
                        unit: 'm3'
                    },
                    native: {},
                });
            }
        }
       
        await this.extendObjectAsync(`SaltRange`, {
            type: 'state',
            common: {
                name: `SaltRange`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'Tage'
            },
            native: {},
        });
       
        await this.extendObjectAsync(`Maintenance`, {
            type: 'state',
            common: {
                name: `Maintenance`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'Tage'
            },
            native: {},
        });
       
        await this.extendObjectAsync(`SaltQuantity`, {
            type: 'state',
            common: {
                name: `SaltQuantity`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: '%'
            },
            native: {},
        });

        await this.extendObjectAsync(`ResidualHardness`, {
            type: 'state',
            common: {
                name: `ResidualHardness`,
                type: 'number',
                read: true,
                write: true,
                def: 0,
                role: 'info',
                unit: '°dH',
                min: 0,
                max: 12
            },
            native: {},
        });

        await this.extendObjectAsync(`NaturalHardness`, {
            type: 'state',
            common: {
                name: `NaturalHardness`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: '°dH'
            },
            native: {},
        });


        await this.extendObjectAsync(`FlowRate`, {
            type: 'state',
            common: {
                name: `max flow rate per h`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'l/h'
            },
            native: {},
        });
        await this.extendObjectAsync(`SoftwareVersion`, {
            type: 'state',
            common: {
                name: `SoftwareVersion`,
                type: 'string',
                read: true,
                write: false,
                role: 'info'
            },
            native: {},
        });
        await this.extendObjectAsync(`HardwareVersion`, {
            type: 'state',
            common: {
                name: `HardwareVersion`,
                type: 'string',
                read: true,
                write: false,
                role: 'info'
            },
            native: {},
        });
        if (this.config.cloud) {
            await this.extendObjectAsync(`WaterTotal`, {
                type: 'state',
                common: {
                    name: `WaterTotal`,
                    type: 'number',
                    read: true,
                    write: false,
                    def: 0,
                    role: 'info',
                    unit: 'l'
                },
                native: {},
            });
            await this.extendObjectAsync(`WaterTotalOut`, {
            type: 'state',
            common: {
                name: `WaterTotalOut`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'l'
            },
            native: {},
            });                   
        } else {
            await this.extendObjectAsync(`WaterTotal`, {
                type: 'state',
                common: {
                    name: `WaterTotal`,
                    type: 'number',
                    read: true,
                    write: false,
                    def: 0,
                    role: 'info',
                    unit: 'm3'
                },
                native: {},
            });
            
            await this.extendObjectAsync(`WaterTotalOut`, {
            type: 'state',
            common: {
                name: `WaterTotalOut`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'm3'
            },
            native: {},
            });    

            await this.extendObjectAsync(`wtuType`, {
            type: 'state',
            common: {
                name: `wtuType`,
                type: 'string',
                read: true,
                write: false,
                role: 'info'
            },
            native: {},
        });    
        }
       
       

        await this.extendObjectAsync(`WaterAverage`, {
            type: 'state',
            common: {
                name: `WaterAverage`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'l'
            },
            native: {},
        });
        
        await this.extendObjectAsync(`Quantity`, {
            type: 'state',
            common: {
                name: `withdrawal quantity`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'l'
            },
            native: {},
        });

        await this.extendObjectAsync(`SerialNumber`, {
            type: 'state',
            common: {
                name: `SerialNumber`,
                type: 'string',
                read: true,
                write: false,
                role: 'info'
            },
            native: {},
        });         
       
        await this.extendObjectAsync(`Connection status`, {
            type: 'state',
            common: {
                name: `Connection status`,
                type: 'string',
                read: true,
                write: false,
                role: 'info'
            },
            native: {},
        });        
       
        await this.extendObjectAsync(`StandByValue`, {
            type: 'state',
            common: {
                name: `StandByValue`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'h'
            },
            native: {},
        });       
        await this.extendObjectAsync(`StandBy`, {
            type: 'state',
            common: {
                name: `StandBy`,
                type: 'boolean',
                role: 'info',
                def: false,
                read: true,
                write: true
            },
            native: {},
        });     
       await this.extendObjectAsync(`Regeneration`, {
            type: 'state',
            common: {
                name: `Regeneration`,
                type: 'boolean',
                role: 'button',
                def: false,
                read: true,
                write: true
            },
            native: {},
        });

        await this.extendObjectAsync(`WaterStopStatus`, {
            type: 'state',
            common: {
                name: `WaterStopStatus`,
                type: 'string',
                read: true,
                write: false,
                role: 'info'
            },
            native: {},
        });
       
        await this.extendObjectAsync(`WaterStop`, {
            type: 'state',
            common: {
                name: `WaterStop`,
                type: 'boolean',
                role: 'state',
                def: false,
                read: true,
                write: true
            },
            native: {},
        });
       
       await this.subscribeStates(`WaterStop`);
       await this.subscribeStates(`Regeneration`);
       await this.subscribeStates(`ResidualHardness`);
       await this.subscribeStates(`StandBy`);
       await this.setState('info.connection', true, true);
   }
    
    async timeConverter(tstmp) {
      var a = new Date(tstmp * 1000);
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var year = a.getFullYear();
      var month = months[a.getMonth()];
      var date = a.getDate();
      var hour = a.getHours();
      if (hour < 10) {
          hour = '0' + hour;
      }
      var min = a.getMinutes();
      if (min < 10) {
          min = '0' + min;
      }

      var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min;
      return time;
  }

   async initialization() {
       try {
           if (this.config.cloud) {
               this.config.ip = "https://www.myjudo.eu/";
           }

           if (this.config.cloud) {
               baseUrl = "https://www.myjudo.eu/interface/";
           } else {
               if (this.config.ip === undefined) {
                    this.log.debug(`ip undefined`);
                    return;
               } else {
                   baseUrl = "https://" + this.config.ip + ":8124/?group=";
               }
           }


           this.log.debug("base url " + baseUrl);   
           
           if (this.config.user === undefined) {
               this.log.debug(`user undefined`);
               return;
           }

           try {
               interval = parseInt(this.config.interval * 1000, 10);
           } catch (err) {
               interval = 600000
           }

       } catch (error) {
           this.log.error('other problem');
       }
   }

}
// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new judoisoftControll(options);
} else {
    // otherwise start the instance directly
    new judoisoftControll();
}
