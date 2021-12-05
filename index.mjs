import express from "express";
import { existsSync, readFileSync, writeFileSync } from "fs";
import bodyParser from "body-parser";
import path, { join } from "path";
import { engine } from "express-handlebars";
import fetch from "node-fetch";

const app = express();
const PORT = 80;
const publicData = {};

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/", (req, res) => {
  res.render("home", {
    commodities: publicData.commodities.map((commodity) => {
      const isRaw = commodity.name.indexOf("(Raw)") != -1;
      const isOre = commodity.name.indexOf("(Ore)") != -1;
      return {
        className:
          commodity.kind.toLowerCase() + (isRaw || isOre ? "--is-raw" : ""),
        symbol: commodity.code,
        name: commodity.name,
        unrefined: isRaw || isOre,
      };
    }),
    stations: JSON.stringify(publicData.tradeports),
    systemmap: JSON.stringify(publicData.systems),
  });
});

app.get("/manifest", (req, res) => {
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  res.send(JSON.stringify(userData));
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.post("/buy", (req, res) => {
  console.log(req.body);
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  userData.push({
    commodity: req.body.commodity,
    shop: req.body.shop || "unknown",
    quantity: req.body.qty || 0,
    price: req.body.price || 0,
  });
  writeFileSync(
    join("data", "userdata.json"),
    JSON.stringify(userData),
    "utf-8"
  );
  res.send(JSON.stringify(userData));
});

app.use(express.static("public"));

app.listen(PORT, async () => {
  console.log("sc-manifest started on Port", PORT);
  if (process.env.UEX_APIKEY) {
    console.log("UEXcorp APIKEY set");
  } else {
    console.error("apikey not found");
  }
  if (process.env.UEX_ENDPOINT) {
    console.log("UEXcorp endpoint set");
  } else {
    console.error("endpoint not found");
  }
  if (process.env.UEX_APIKEY && process.env.UEX_ENDPOINT) {
    const UEX_APIKEY = process.env.UEX_APIKEY;
    const UEX_ENDPOINT = process.env.UEX_ENDPOINT;
    console.log("establishing UEXcorp link");
    const tradeports = await fetch(UEX_ENDPOINT + "tradeports", {
      headers: { api_key: UEX_APIKEY },
    }).then((response) => response.json());
    console.log(`uplink to ${tradeports.data.length} tradeports established`);
    publicData.tradeports = tradeports.data;
    console.log("requesting commodity listing");
    const commodities = await fetch(UEX_ENDPOINT + "commodities", {
      headers: { api_key: UEX_APIKEY },
    }).then((response) => response.json());
    console.log(
      `recieved ${commodities.data.length} commodities on publicData trading channels`
    );
    publicData.commodities = commodities.data;
    const systemmap = JSON.parse(
      readFileSync(join("data", "systemmap.json"), "utf-8")
    );
    console.log("Preparing System Map for ST");
    publicData.systems = systemmap;

    const fn = (tradeport) => {
      // tradeport system, planet, satellite, city
      const starsystem = publicData.systems.find(
        (c) => c.code == tradeport.system && c.trade != "1"
      );
      if (starsystem) {
        console.log(starsystem);
        const planet = starsystem.children.find(
          (c) => c.code == tradeport.planet && c.trade != "1"
        );
        if (planet) {
          const moon = planet.children.find(
            (c) => c.code == tradeport.satellite && c.trade != "1"
          );
          const city = planet.children.find(
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
            planet.children.push(tradeport);
          }
        }
      }
    };
    publicData.tradeports.forEach((tradeport) => fn(tradeport));
    writeFileSync("publicdata.json", JSON.stringify(publicData), "utf-8");
    console.log("everything is up and running");
  }
});
