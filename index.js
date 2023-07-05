require('dotenv').config();
var cron = require('node-cron');
const EnviaL4D2Whitelist = require('./src/EnviaL4D2Whitelist');

cron.schedule('* * * * *', async () => {
    console.log("Running Envia L4D2 Whitelist ... ");
    
    try {
        EnviaL4D2Whitelist.rconConfig = {
            host: process.env.ENVIA_L4D2_WHITELIST_RCON_HOST,
            port: process.env.ENVIA_L4D2_WHITELIST_RCON_PORT,
        };
        EnviaL4D2Whitelist.rconPassword = process.env.ENVIA_L4D2_WHITELIST_RCON_PASS;
        EnviaL4D2Whitelist.steamGroupXMLURL = process.env.ENVIA_L4D2_WHITELIST_STEAM_GROUP_XML_URL;
        EnviaL4D2Whitelist.whitelistTxtPath = process.env.ENVIA_L4D2_WHITELIST_TXT_FILEPATH;
        EnviaL4D2Whitelist.forceSteamIDAllow = process.env.ENVIA_L4D2_WHITELIST_FORCE_ALLOW_ID;
        EnviaL4D2Whitelist.postCommand = process.env.ENVIA_L4D2_WHITELIST_POST_COMMAND;

        await EnviaL4D2Whitelist.GrabData();
        await EnviaL4D2Whitelist.RefreshWhitelistInGame();

        console.log("Running Envia L4D2 Whitelist ... Success");

    } catch (error) {
        console.log(error);
    }
});

(async  () => {
    
})();