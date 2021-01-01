/**
 *
 *      ioBroker judoisoft Adapter
 *
 *      (c) 2014-2018 arteck <arteck@outlook.com>
 *
 *      MIT License
 *
 */
'use strict';

const utils = require('@iobroker/adapter-core');
const axios = require('axios');
const https = require('https');
const setStr = 'setStringSetting';
const commandsStr = 'Commands';
const infoStr = 'Info';

let interval = 0;
let requestTimeout = null;


// At request level
const agent = new https.Agent({  
    rejectUnauthorized: false
});


let baseUrl = "";
let _token;

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
        this.on('objectChange', this.onObjectChange.bind(this));
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
        _token = await this.getTokenFirst();
        await this.getInfoStatic();
        await this.getInfos();
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
     * Is called if a subscribed object changes
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            // The object was deleted
            this.log.info(`object ${id} deleted`);
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {

        if (state) {
            this.log.debug(`stateID ${id} changed: ${state.val} (ack = ${state.ack})`);
            
            let tmp = id.split('.');
            let command = tmp.pop();

            if (state.ack != null) {
                this.setCommandState(command, state.val);
            }
    
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    
    async getInfoStatic() {
        this.log.debug("get Information Static");

        try {
                       
            const responses = await axios.all([
                    //SoftwareVersion
                await axios.get(baseUrl + "version&command=software%20version&msgnumber=1&token=" + _token, { httpsAgent: agent }),
                    //HardwareVersion
                await axios.get(baseUrl + "version&command=hardware%20version&msgnumber=1&token=" + _token, { httpsAgent: agent }),
                    //InstallationDate
                await axios.get(baseUrl + "contract&command=init%20date&msgnumber=1&token=" + _token, { httpsAgent: agent }),
                    //ServiceDate
                await  axios.get(baseUrl + "contract&command=service%20date&msgnumber=1&token=" + _token, { httpsAgent: agent })               
            ]);

            for (const key in responses) {
                this.log.debug("get Information Static " + key + " " + JSON.stringify(responses[key].data))
            }

            this.setState("SoftwareVersion", responses[0].data.data, true);
            this.setState("HardwareVersion", responses[1].data.data, true);
            
            const inst = await this.timeConverter(responses[2].data.data);
            this.setState("InstallationDate", inst, true);
            
            const serv = await this.timeConverter(responses[3].data.data);
            this.setState("ServiceDate", serv, true);
                       
        } catch (err) {
            this.log.debug('getInfoStatic ERROR' + JSON.stringify(err));
        }
    }

    async getInfos() {
        this.log.debug("get Information ");

        // check loged in
        let stats = await axios.get(baseUrl + "register&command=plumber%20address&msgnumber=1&token=" + _token, { httpsAgent: agent });
        
        if (stats.data.status == 'error') {
            this.log.info("reconnect " + Date.now()); 
            _token = await this.getTokenFirst();
        } 
     
        try {
            if (_token) {   
                this.setState("lastInfoUpdate", Date.now(), true);
                const responses = await axios.all([
                    //WaterCurrent
                    await axios.get(baseUrl + "consumption&command=water%20current&msgnumber=1&token=" + _token, { httpsAgent: agent }),
                    //SaltRange
                    await axios.get(baseUrl + "consumption&command=salt%20range&msgnumber=1&token=" + _token, { httpsAgent: agent }),
                    //SaltQuantity
                    await axios.get(baseUrl + "consumption&command=salt%20quantity&msgnumber=1&token=" + _token, { httpsAgent: agent }),
                    //WaterAverage
                    await axios.get(baseUrl + "consumption&command=water%20average&msgnumber=1&token=" + _token, { httpsAgent: agent }),
                    //ResidualHardness
                    await axios.get(baseUrl + "settings&command=residual%20hardness&msgnumber=1&token=" + _token, { httpsAgent: agent }),
                    //NaturalHardness
                    await axios.get(baseUrl + "info&command=natural%20hardness&msgnumber=1&token=" + _token, { httpsAgent: agent }),
                    //FlowRate
                    await axios.get(baseUrl + "waterstop&command=flow%20rate&msgnumber=1&token=" + _token, { httpsAgent: agent }),
                    //Quantity
                    await axios.get(baseUrl + "waterstop&command=quantity&msgnumber=1&token=" + _token, { httpsAgent: agent }),                                

                    //WaterTotal
                    await axios.get(baseUrl + "consumption&command=water%20total&msgnumber=1&token=" + _token, { httpsAgent: agent }),
                     //WaterYearly
                    await axios.get(baseUrl + "consumption&command=water%20yearly&msgnumber=1&token=" + _token, { httpsAgent: agent }),

                    //ValveState
                    await axios.get(baseUrl + "waterstop&command=valve&msgnumber=4&&token=" + _token, { httpsAgent: agent })
                ]);

                for (const key in responses) {
                    this.log.debug("position " + key + " " + JSON.stringify(responses[key].data))
                }

                this.setState(`WaterCurrent`, responses[0].data.data, true);
                this.setState(`SaltRange`, responses[1].data.data, true);
                this.setState(`SaltQuantity`, responses[2].data.data, true);
                this.setState(`WaterAverage`, responses[3].data.data, true);
                this.setState(`ResidualHardness`, responses[4].data.data, true);
                this.setState(`NaturalHardness`, responses[5].data.data, true);
                this.setState(`FlowRate`, responses[6].data.data, true);
                this.setState(`Quantity`, responses[7].data.data, true);

                let splWass = responses[8].data.data.split(" ");
                this.setState(`WaterTotal`, splWass[1] / 1000, true);

                let splWassJahr = responses[9].data.data.split(" ");
                for (var b = 1; b < 13; b++) {
                   let a = b;
                   if (a < 10) {
                     a = '0' + a;
                   }
                    
                   const monat = splWassJahr[b]; 
                   if (monat < 0) {
                     monat = 0;    
                   } else {
                     monat = monat / 1000;
                   }
                    
                   this.setState(`WaterYearly.${a}`, monat, true);
                }

                this.setState(`WaterStopStatus`, responses[10].data.data, true);

                if (responses[10].data.data == 'opened') {
                    this.setState(`WaterStop`, false, false);
                } else {
                    this.setState(`WaterStop`, true, false);
                }
            } // if _token

            requestTimeout = setTimeout(async () => {
                this.getInfos();
            }, interval);

        } catch (err) {
            this.log.debug('getInfos ERROR' + JSON.stringify(err));
        }
    }

   async getTokenFirst() {
        const statusURL = baseUrl + "register&command=login&msgnumber=1&name=login&user=" + this.config.user + "&password=" + this.config.password + "&role=customer";

        this.log.debug("getURL: " + statusURL);
       
        try {       
            const tokenObject = await axios.get(statusURL, { httpsAgent: agent });
            this.log.debug("getToken: " + JSON.stringify(tokenObject.data));    
           
            _token = tokenObject.data.token;
            
            this.setState("token", _token, true);  
             //Serial
            const serResult = await axios.get(baseUrl + "register&command=show&msgnumber=2&token=" + _token, { httpsAgent: agent });
            this.log.debug("getSerialnumber : " + JSON.stringify(serResult.data));
            
            const wtuType = serResult.data.data[0]["wtuType"];
            const serialN = serResult.data.data[0]["serial number"];

            this.setState("wtuType", wtuType, true);
            this.setState("SerialNumber", serialN, true);
            
            //Connect            
            const conResult = await axios.get(baseUrl + "register&command=connect&msgnumber=1&token=" + _token + "&parameter=" + wtuType + "&serial%20number=" + serialN, { httpsAgent: agent });
            this.log.debug("connect Result: " + JSON.stringify(conResult.data));
             
            this.setState("Connection status", conResult.data.status, true);
            
            return _token;
        } catch (err) {
           this.setState("Connection status", "ERROR", true);
           this.log.debug("getToken: " + JSON.stringify(tokenObject.data));      
           this.setState('info.connection', false, false);
           return null;
        }
   }

   async create_state() {
        this.log.debug(`create state`);

        this.extendObjectAsync(`token`, {
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

        this.extendObjectAsync(`lastInfoUpdate`, {
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

        this.extendObjectAsync(`InstallationDate`, {
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
        this.extendObjectAsync(`ServiceDate`, {
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
       
        this.extendObjectAsync(`WaterCurrent`, {
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

        this.extendObjectAsync(`WaterYearly`, {
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
           this.extendObjectAsync(`WaterYearly.${b}`, {
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

        this.extendObjectAsync(`SaltRange`, {
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

        this.extendObjectAsync(`SaltQuantity`, {
            type: 'state',
            common: {
                name: `SaltQuantity`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info'
            },
            native: {},
        });

        this.extendObjectAsync(`ResidualHardness`, {
            type: 'state',
            common: {
                name: `ResidualHardness`,
                type: 'number',
                read: true,
                write: true,
                def: 0,
                role: 'info',
                unit: '°dH'
            },
            native: {},
        });


        this.extendObjectAsync(`NaturalHardness`, {
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


        this.extendObjectAsync(`FlowRate`, {
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
        this.extendObjectAsync(`SoftwareVersion`, {
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
        this.extendObjectAsync(`HardwareVersion`, {
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

        this.extendObjectAsync(`WaterTotal`, {
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

        this.extendObjectAsync(`WaterAverage`, {
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
        
        this.extendObjectAsync(`Quantity`, {
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

        this.extendObjectAsync(`SerialNumber`, {
            type: 'state',
            common: {
                name: `SerialNumber`,
                type: 'number',
                read: true,
                write: false,
                role: 'info'
            },
            native: {},
        });
       
        this.extendObjectAsync(`wtuType`, {
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
       
        this.extendObjectAsync(`Connection status`, {
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
       
       this.extendObjectAsync(`Regeneration`, {
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

        this.extendObjectAsync(`WaterStopStatus`, {
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
       
        this.extendObjectAsync(`WaterStop`, {
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

       this.subscribeStates(`Vacation`);
       this.subscribeStates(`WaterStop`);
       this.subscribeStates(`Regeneration`);
       
       this.setState('info.connection', true, true);
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

    async setCommandState(command, state) {
        switch (command) {             
            case 'Regeneration':
                this.log.debug("Regeneration " + state);
                await axios.get(baseUrl + "settings&command=regeneration&msgnumber=1&token=" + _token + "&parameter=start", { httpsAgent: agent });   
                break;
            case 'WaterStop':
                this.log.debug("WaterStop " + state);
                if (state) {                            
                    const val = await axios.get(baseUrl + "waterstop&command=valve&msgnumber=1&token=" + _token + "&parameter=close", { httpsAgent: agent });
                    this.setState("WaterStopStatus", val.data.parameter, true);
                } else {
                    const val = await axios.get(baseUrl + "waterstop&command=valve&msgnumber=1&token=" + _token + "&parameter=open", { httpsAgent: agent });
                    this.setState("WaterStopStatus", val.data.parameter, true);
                }

                this.setState("lastInfoUpdate", Date.now(), true);
                break;                        
             default:
        }
   }

   async initialization() {
        try {
            if (this.config.ip === undefined) {
                this.log.debug(`ip undefined`);
                callback();
            } else {
                baseUrl = "https://" + this.config.ip + ":8124/?group=";
            }

            if (this.config.user === undefined) {
                this.log.debug(`user undefined`);
                callback();
            }

            if (this.config.serial === undefined) {
                this.log.debug(`serial undefined`);
                callback();
            }
            try {
                interval = parseInt(this.config.interval * 1000, 10);
            } catch (err) {
                interval = 600000
            }

        } catch (error) {
            this.log.error('No one IP configured');
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
