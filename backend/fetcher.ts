import fetch from "node-fetch";
import { CommodityEntry, PublicData, PublicTradeport, ShipData, ShipResponse } from "./types";
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

const update319Prices = function (dataset:CommodityEntry[]):any {
  return dataset.map( (set: CommodityEntry) => {
    return {
      ...set,
      trade_price_buy: (set.trade_price_buy || 0) / 100,
      trade_price_sell: (set.trade_price_sell || 0) / 100,
    }
  });
}

const fetchCommodities = async function () {
  if (process.env.UEX_APIKEY && process.env.UEX_ENDPOINT) {
    const UEX_APIKEY = process.env.UEX_APIKEY;
    const UEX_ENDPOINT = process.env.UEX_ENDPOINT;
    const commodities = await fetch(UEX_ENDPOINT + "commodities", {
      headers: { api_key: UEX_APIKEY },
    }).then((response) => response.json());
    
    return update319Prices(commodities.data);
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
      if (tradeport.satellite) path.push(tradeport.satellite);
      else if (tradeport.city) path.push(tradeport.city);
      
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
        if (!location.children.find(t => t as unknown as string === tradeport.code)) {
          location.children.push(tradeport.code);
        }
      } else {
        tradeport.path = path;
        publicData.tradeports?.push(tradeport);
      }
    })
    return publicData;
  }
}

export { fetchCommodities, fetchShips, fetchTradeports };