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

const findAllShips = (by) => {
    if (by) {
        return retrieveUserData().ships.filter(by);
    } else {
        return retrieveUserData().ships;
    }
    
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


const updateShip = (shipId, newShip) => {
    let userData = retrieveUserData();
    let index = userData.ships.findIndex(predicate => predicate.ship === shipId);
    if (index>=0) {
        userData.ships.splice(index, 1);
        userData.ships.push(newShip);
        
        writeFileSync(
            join("data", "userdata.json"),
            JSON.stringify(userData),
            "utf-8"
        );
        return true;
    } else {
        return false;
    }
}

const updateManifest = (manifestId, newManifest) => {
    let userData = retrieveUserData();
    let index = userData.manifests.findIndex(predicate => predicate.manifest === manifestId);
    if (index >= 0) {
        userData.manifests.splice(index, 1); // remove previous entry as it is no longer valid
    }
    userData.manifests.push(newManifest); // push updated or new entry into array
    
    writeFileSync(
        join("data", "userdata.json"),
        JSON.stringify(userData),
        "utf-8"
    );
    return true;
}

const findManifest = (by) => {
    const userData = retrieveUserData();
    return userData.manifests.find(by);
}


const findAllManifests = (by) => {
    if (by) {
        return retrieveUserData().manifests.filter(by);
    } else {
        return retrieveUserData().manifests;
    }
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
    findAllShips,
    findRegistrarShip,
    findAllRegistrarShips,
    insertShip,
    findManifest,
    findCommodity,
    findAllCommodities,
    findAllManifests,
    updateManifest,
    updateShip,
}