import fetch from "node-fetch";
import { PublicData, ShipData, ShipResponse } from "./types";
const { join } = require("path");
const { readFileSync, writeFileSync, existsSync, exists } = require("fs");

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

    const fn = (tradeport: any) => {
      // tradeport system, planet, satellite, city
      const starsystem = publicData.systems?.find(
        (c) => c.code == tradeport.system && c.trade != "1"
      );
      if (starsystem) {
        const planet = starsystem.children?.find(
          (c) => c.code == tradeport.planet && c.trade != "1"
        );
        if (planet) {
          const moon = planet.children?.find(
            (c) => c.code == tradeport.satellite && c.trade != "1"
          );
          const city = planet.children?.find(
            (c) => c.code == tradeport.city && c.trade != "1"
          );

          if (moon) {
            // is on a moon
            if (!moon.children) moon.children = [];
            moon.children.push(tradeport);
          } else if (city) {
            // must be in a city
            if (!city.children) city.children = [];
            city.children.push(tradeport);
          } else {
            // must be planetside
            planet.children?.push(tradeport);
          }
        }
      }
    };
    publicData.tradeports?.forEach((tradeport) => fn(tradeport));
    return publicData;
  }
}

export { fetchCommodities, fetchShips, fetchTradeports };