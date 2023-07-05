const SteamID = require('steamid');
const axios = require('axios');
const Rcon = require('rcon-srcds').default;
const fs = require('fs');
const { XMLValidator, XMLParser } = require('fast-xml-parser');

/**
 * A simple class to generate whitelist by fetching member of Steam Group
 * Suitable for this plugin: https://forums.alliedmods.net/showthread.php?p=1830686
 * 
 * Why using separated services?
 * Sometime by using plugin above, especially by steam group, whitelist can't be refresh immediatelly
 * when there is a change number of Steam Group member. If there is a new member, they can't join properly and
 * still blacklisted until several minutes or even server has to be restarted.
 * 
 * Before using this class, please fill class properties, they are mandatory (except forceSteamIDAllow)
 * 
 */
class EnviaL4D2Whitelist {
    static rconConfig = {};
    static rconPassword = "";
    static steamGroupXMLURL = "";
    static whitelistTxtPath = "";
    static forceSteamIDAllow = "";
    static postCommand = "";

    static GrabData = async () => {
        let groupResponses = await axios.get(this.steamGroupXMLURL); //Yekan

        const isParseSuccess = XMLValidator.validate(groupResponses.data);
        if (!isParseSuccess)
            throw 'XML invalid';

        const parser = new XMLParser();
        const xmlParseResult = parser.parse(groupResponses.data);

        let arrSteamId = xmlParseResult.memberList.members.steamID64;
        if (!Array.isArray(arrSteamId))
            arrSteamId = [arrSteamId];

        let arrSteamObjId = [];
        let arrWhitelistText = [];

        arrWhitelistText.push('; You can use \';\' to have comments (not read by the plugin)\n');
        arrWhitelistText.push('; Write directly to insert either a SteamID or an IP\n');
        arrWhitelistText.push('; Don\'t put more than 250 char on a line\n');
        arrWhitelistText.push('; \';auto\' tags gives various information surrounding an added user\n');
        arrWhitelistText.push('\n');

        for (const stid of arrSteamId) {
            const profileResponses = await axios.get(`https://steamcommunity.com/profiles/${stid}/?xml=1`);
            const isParseSuccess = XMLValidator.validate(groupResponses.data);
            if (!isParseSuccess) {
                console.log(`Get profile failed for ${stid}`);
                return;
            }

            const xmlParseResult = parser.parse(profileResponses.data);
            const objSteam = new SteamID(String(stid));

            arrSteamObjId.push({
                steamID: xmlParseResult.profile.steamID,
                realname: xmlParseResult.profile.realname,
                steam2ID: objSteam.getSteam2RenderedID().replace(/STEAM_0/g, "STEAM_1"),
            });

            arrWhitelistText.push(objSteam.getSteam2RenderedID().replace(/STEAM_0/g, "STEAM_1") + ' ; ' + xmlParseResult.profile.steamID + ' \n');
        }

        //Allow custom Steam ID to be added
        let arrCustomSteamIDAllow = this.forceSteamIDAllow.split(",");
        for (const stid of arrCustomSteamIDAllow) {
            arrSteamObjId.push({
                steamID: "",
                realname: "",
                steam2ID: stid,
            });

            arrWhitelistText.push(stid + ' ; custom whitelist users \n');
        }

        fs.writeFile(this.whitelistTxtPath, arrWhitelistText.join(""), function (err) {
            if (err) return console.log(err);

            console.log("The file was saved!");
        });
    };

    static RefreshWhitelistInGame = async () => {
        const server = new Rcon(this.rconConfig);

        let arrCommand = this.postCommand.split("|");
        if (arrCommand.length < 1)
            return;

        server.authenticate(this.rconPassword)
            .then(async () => {
                console.log('RCON authenticated!');

                for (const rconCommand of arrCommand)
                    console.log(server.execute(rconCommand));

                await server.disconnect();
            })
            .then(console.log)
            .catch(console.error);
    };
}

module.exports = EnviaL4D2Whitelist;