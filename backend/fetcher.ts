import fetch from "node-fetch";
import { PublicData, PublicTradeport, ShipData, ShipResponse } from "./types";
import { join } from"path";
import { readFileSync } from "fs";

const fetchShips = async function () {
  if (process.env.UEX_APIKEY && process.env.UEX_ENDPOINT) {
    const UEX_APIKEY = process.env.UEX_APIKEY;
    const UEX_ENDPOINT = process.env.UEX_ENDPOINT;
    const shipResponse: ShipResponse = await fetch(UEX_ENDPOINT + "ships", {
      headers: { api_key: UEX_APIKEY },
    })
      .then((response) => response.json())
      .catch((error) => console.error(error));
    const ships = shipResponse.data
      .filter((shipData: ShipData) => shipData.scu > 0 && shipData.implemented == "1")
      .map((shipData: ShipData) => {
        return {
          manufacturer: shipData.manufacturer,
          series: shipData.series,
          code: shipData.code,
          scu: shipData.scu,
          name: shipData.name,
        };
      });

    return ships;
  }
}

const fetchCommodities = async function () {
  if (process.env.UEX_APIKEY && process.env.UEX_ENDPOINT) {
    const UEX_APIKEY = process.env.UEX_APIKEY;
    const UEX_ENDPOINT = process.env.UEX_ENDPOINT;
    const commodities = await fetch(UEX_ENDPOINT + "commodities", {
      headers: { api_key: UEX_APIKEY },
    }).then((response) => response.json());
    return commodities.data;
  }
}

const fetchTradeports = async function (systems?: any) {
  if (process.env.UEX_APIKEY && process.env.UEX_ENDPOINT) {
    const UEX_APIKEY = process.env.UEX_APIKEY;
    const UEX_ENDPOINT = process.env.UEX_ENDPOINT;
    const publicData = {} as PublicData;
    publicData.systems = JSON.parse(
      readFileSync(join("data", "systemmap.json"), "utf-8")
    );

    const tradeports = await fetch(UEX_ENDPOINT + "tradeports", {
      headers: { api_key: UEX_APIKEY },
    }).then((response) => response.json());

    publicData.tradeports = tradeports.data;
    tradeports.data.forEach( (tradeport:PublicTradeport) => {
      const path: string[] = [];
      if (tradeport.system) path.push(tradeport.system);  
      if (tradeport.planet) path.push(tradeport.planet);
      if (tradeport.satellite) path.push(tradeport.satellite)
      else if (tradeport.city) path.push(tradeport.city)
      
      const location = publicData.systems?.find((s) => {
        if (s.path) {
          const target = JSON.stringify([...s.path, s.code]);
          const stringifiedPath = JSON.stringify(path);
          return stringifiedPath === target
        } else {
          return false
        }
      });
      if (location) {
        if (!location.children) {
          location.children = [];
        }
        console.log('adding ' + tradeport.code + ' to ' + location.code);
        location.children.push(tradeport.code)
      }
      tradeport.path = path;
      publicData.tradeports?.push(tradeport);
    })
    return publicData;
  }
}

export { fetchCommodities, fetchShips, fetchTradeports };