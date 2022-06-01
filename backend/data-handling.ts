import { ManifestData, PublicSystem, PublicTradeport, ShipData, TypedElement } from "./types";
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

function walker (byCode: string, currentElement: PublicSystem[]): PublicSystem|undefined {
    const element = currentElement.find((element) => element.code === byCode);
    if (element) { // expanding data
        let expandedElement = { ...element };
        expandedElement.children = expandedElement.children?.map((code) => {
            const systemElement = retrievePublicData().systems.find((element: TypedElement) => element.code === byCode);
            const tradeportElement = retrievePublicData().tradeports.find((element: TypedElement) => element.code === byCode);
            if (systemElement) {
                return systemElement
            } else {
                return tradeportElement
            }
        }) as any;
    }
    return element;
}

export const findPOIByPath = (byPath: string[]): any => {
    if (byPath) {
        const element = retrievePublicData().systems.find((s: PublicSystem) => {
           if (s.path) {
          const target = JSON.stringify([...s.path, s.code]);
          const stringifiedPath = JSON.stringify(byPath);
          return stringifiedPath === target
        } else {
          return false
        }
        })
        if (element) { // expanding data
        let expandedElement = { ...element };
        expandedElement.children = expandedElement.children?.map((code: string) => {
            const systemElement = retrievePublicData().systems.find((element: TypedElement) => element.code === code);
            const tradeportElement = retrievePublicData().tradeports.find((element: TypedElement) => element.code === code);
            if (systemElement) {
                return systemElement
            } else {
                return tradeportElement
            }
        }) as any;
            return expandedElement;
        }
        
    }
    return;
}

export const findPOI = (byCode?: string): PublicSystem | any => {
    if (byCode) {
        const system = walker(byCode, retrievePublicData().systems);
        if (system) {
            return system;
        } else {
            return retrievePublicData().tradeports.find( (t: PublicTradeport) => t.code === byCode);
        }
    } else {
        return {};
    }
}