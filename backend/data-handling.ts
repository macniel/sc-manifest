import { ManifestData, PublicSystem, ShipData } from "./types";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync, exists } from "fs";

export const retrieveUserData = () => {
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

export const retrievePublicData = () => {
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

export const findShip = (by: Function) => {
    return retrieveUserData().ships.find(by);
}

export const findAllShips = (by?: Function) => {
    if (by) {
        return retrieveUserData().ships.filter(by);
    } else {
        return retrieveUserData().ships;
    }
    
}

export const findRegistrarShip = (by:Function) => {
    return retrievePublicData().ships.find(by);
}

export const findAllRegistrarShips = (by?:Function) => {
    if (by) {
        return retrievePublicData().ships.filter(by);
    } else {
        return retrievePublicData().ships;
    }
}


export const insertShip = (newShip:ShipData) => {
    let userData = retrieveUserData();
    userData.ships.push(newShip);
    writeFileSync(
        join("data", "userdata.json"),
        JSON.stringify(userData),
        "utf-8"
    );
}


export const updateShip = (shipId: string, newShip:ShipData|null) => {
    let userData = retrieveUserData();
    let index = userData.ships.findIndex( (predicate:ShipData) => predicate.ship === shipId);
    if (index>=0) {
        userData.ships.splice(index, 1);
        if (newShip != null) {
            userData.ships.push(newShip);
        }
        
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

export const updateManifest = (manifestId:string, newManifest:ManifestData) => {
    let userData = retrieveUserData();
    let index = userData.manifests.findIndex( (predicate:ManifestData) => predicate.manifest === manifestId);
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

export const findManifest = (by:Function) => {
    const userData = retrieveUserData();
    return userData.manifests.find(by);
}


export const findAllManifests = (by?:Function) => {
    if (by) {
        return retrieveUserData().manifests.filter(by);
    } else {
        return retrieveUserData().manifests;
    }
}

export const findCommodity = (by:Function) => {
    return retrievePublicData().commodities.find(by);
}

export const findAllCommodities = (by?:Function) => {
    if (by) {
        return retrievePublicData().commodities.filter(by);
    } else {
        return retrievePublicData().commodities;
    }
}

export const findShop = (by: Function) => {
    return retrievePublicData().tradeports.find(by);
}

function walker (byCode: string, currentElement: PublicSystem): PublicSystem|undefined {
    if (currentElement.code === byCode) {
        return currentElement;
    } else {
        if (currentElement.children) {
            for (let i = 0; i < currentElement.children.length; ++i) {
                let poi = walker(byCode, currentElement.children[i]);
                if (poi) {
                    return poi;
                }
            }
        } else {
            return;
        }
    }
}

export const findPOI = (byCode?: string): PublicSystem | any => {
    if (byCode) {
        return walker(byCode, retrievePublicData().systems[0]);
    } else {
        return {};
    }
}