const { join } = require("path");
const { readFileSync, writeFileSync, existsSync, exists } = require("fs");

function retrieveUserData() {
    let ud = JSON.parse(
        readFileSync(join("data", "userdata.json"), "utf-8")
    );
    if (!ud) {
        return {
            ships: [],
            manifests: [],
        };
    } else {
        return ud;
    }
}

function retrievePublicData() {
    let pd = JSON.parse(
        readFileSync(join("data", "publicdata.json"), "utf-8")
    );
    if (!pd) {
        return {
            commodities: [],
            ships: [],
            tradeports: [],
            systems: []
        };
    } else {
        return pd;
    }
}

const findShip = (by) => {
    return retrieveUserData().ships.find(by);
}

const findRegistrarShip = (by) => {
    return retrievePublicData().ships.find(by);
}

const findAllRegistrarShips = (by) => {
    if (by) {
        return retrievePublicData().ships.filter(by);
    } else {
        return retrievePublicData().ships;
    }
}


const insertShip = (newShip) => {
    let userData = retrieveUserData();
    userData.ships.push(newShip);
    writeFileSync(
        join("data", "userdata.json"),
        JSON.stringify(userData),
        "utf-8"
    );
}

const findManifest = (by) => {
    const userData = retrieveUserData();
    return userData.manifests.find(by);
}

const findCommodity = (by) => {
    return retrievePublicData().commodities.find(by);
}

const findAllCommodities = (by) => {
    if (by) {
        return retrievePublicData().commodities.filter(by);
    } else {
        return retrievePublicData().commodities;
    }
}

module.exports = {
    findShip,
    findRegistrarShip,
    findAllRegistrarShips,
    insertShip,
    findManifest,
    findCommodity,
    findAllCommodities
}