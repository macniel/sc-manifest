const express = require("express");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const bodyParser = require("body-parser");
const { join } = require("path");
const { engine } = require("express-handlebars");
const fetch = require("node-fetch");
const guid = require("guid");

const app = express();
const PORT = process.env.PORT;
let publicData = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/ship/:shipId", (req, res) => {
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  if (!userData.ships) {
    userData.ships = [];
  }

  const found = userData.ships.find((ship) => ship.ship === req.params.shipId);
  if (found) {
    res.send(JSON.stringify(found));
  } else {
    res.sendStatus(404);
  }
});

app.post("/ship", (req, res) => {
  const name = req.body.shipName;
  const actualShip = publicData.ships.find(
    (ship) => ship.code === req.body.code
  );
  console.log(publicData.ships);
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  newShip = {
    shipsName: name,
    name: actualShip.name,
    manufacturer: actualShip.manufacturer,
    scu: actualShip.scu,
    code: actualShip.code,
    associatedManifest: null,
    ship: guid.raw(),
  };

  if (!userData.ships) {
    userData.ships = [];
  }

  userData.ships.push(newShip);

  writeFileSync(
    join("data", "userdata.json"),
    JSON.stringify(userData),
    "utf-8"
  );
  res.send(JSON.stringify(newShip));
});

app.get("/manifest/:manifestId", (req, res) => {
  console.log("GET MANIFEST " + req.params.manifestId);
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  const m = userData.manifests.find(
    (manifest) => manifest.manifest === req.params.manifestId
  );
  if (m) {
    console.log(m);
    res.send(JSON.stringify(m));
  } else {
    res.sendStatus(404);
  }
});

app.get("/commodities", (req, res) => {
  if (publicData.commodities) {
    return res.send(publicData.commodities);
  }
});

app.get("/ships/:shipId/manifest", (req, res) => {
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  if (userData.ships.find((ship) => ship.ship === req.params.shipId)) {
    if (
      ship.associatedManifest &&
      userData.manifests.find((m) => m.manifest === ship.associatedManifest)
    ) {
      ship.manifest = userData.manifests.find(
        (m) => m.manifest === ship.associatedManifest
      );
      res.send(JSON.stringify(ship));
    }
  } else {
    res.sendStatus(404);
  }
});

app.get("/log/:manifest", (req, res) => {
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  const manifest = userData.manifests.find(
    (manifest) => req.params.manifest === manifest.manifest
  );
  if (manifest) {
    res.send(JSON.stringify(manifest));
    return;
  }
  res.sendStatus(404);
});

app.post("/archive", (req, res) => {
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  const manifest = userData.manifests.find(
    (manifest) => req.body.manifest === manifest.manifest
  );
  if (manifest) {
    // find corresponding ship
    const ship = userData.ships.find((ship) => {
      return ship.associatedManifest === manifest.manifest;
    });

    if (ship) {
      ship.associatedManifest = null;
      manifest.isArchived = true;
      manifest.associatedShip = ship;

      writeFileSync(
        join("data", "userdata.json"),
        JSON.stringify(userData),
        "utf-8"
      );
      res.send(JSON.stringify(manifest));
    }
  } else {
    res.sendStatus(404);
  }
});

app.post("/sell", (req, res) => {
  console.log(req.body);
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  const envelope = req.body;
  const manifest = userData.manifests.find(
    (manifest) => manifest.manifest == envelope.manifest
  );

  // reduce capacity
  const commodity = manifest.commodities.find(
    (commodity) => commodity.code === req.body.commodity
  );

  if (!commodity || commodity.amount < envelope.quantity) {
    // selling commodity you dont have?!
    res.sendStatus(500);
    return;
  } else {
    commodity.amount -= envelope.quantity;
  }

  if (!manifest.history) {
    manifest.history = [];
  }

  manifest.history.push({
    destination: envelope.shop,
    quantity: parseInt(envelope.quantity),
    price: parseFloat(envelope.price),
    commodity: envelope.commodity,
  });

  manifest.profit =
    parseFloat(manifest.profit) +
    parseInt(envelope.quantity) * parseFloat(envelope.price);

  console.log(userData);
  writeFileSync(
    join("data", "userdata.json"),
    JSON.stringify(userData),
    "utf-8"
  );
  res.send(JSON.stringify(manifest));
});

app.post("/buy", (req, res) => {
  if (req.body.to) {
    let userData = JSON.parse(
      readFileSync(join("data", "userdata.json"), "utf-8")
    );

    if (!userData.manifests) {
      userData.manifests = [];
    }

    const ship = userData.ships.find((ship) => req.body.to === ship.ship);
    let manifest = {};
    if (
      !ship.associatedManifest ||
      !userData.manifests.find(
        (manifest) => ship.associatedManifest === manifest.manifest
      )
    ) {
      manifest = {
        manifest: guid.raw(),
        transactions: [],
        commodities: [],
        profit: 0,
      };
      ship.associatedManifest = manifest.manifest;
      userData.manifests.push(manifest);
    } else {
      manifest = userData.manifests.find(
        (manifest) => ship.associatedManifest === manifest.manifest
      );
    }
    // calculate cost of buy
    manifest.profit -= parseInt(req.body.quantity) * parseFloat(req.body.price);
    manifest.transactions.push({
      code: req.body.commodity,
      source: req.body.from,
      destination: req.body.to,
      quantity: req.body.quantity,
      price: req.body.price,
    });
    // find similar commodity to add
    let commodity = manifest.commodities.find(
      (commodity) => commodity.code === req.body.commodity
    );
    if (!commodity) {
      const template = publicData.commodities.find(
        (c) => c.code === req.body.commodity
      );
      commodity = {
        amount: 0,
        total: 0,
        code: template.code,
        name: template.name,
        kind: template.kind,
      };
      manifest.commodities.push(commodity);
    }
    commodity.amount += parseInt(req.body.quantity);
    commodity.total += parseInt(req.body.quantity);

    writeFileSync(
      join("data", "userdata.json"),
      JSON.stringify(userData),
      "utf-8"
    );
    res.send(JSON.stringify(manifest));
  } else {
    res.sendStatus(400);
  }
});

app.get("/ships", (req, res) => {
  res.send(JSON.stringify(publicData.ships));
});

app.use(express.static("./frontend/build"));

async function fetchShips() {
  if (process.env.UEX_APIKEY && process.env.UEX_ENDPOINT) {
    const UEX_APIKEY = process.env.UEX_APIKEY;
    const UEX_ENDPOINT = process.env.UEX_ENDPOINT;
    let ships = await fetch(UEX_ENDPOINT + "ships", {
      headers: { api_key: UEX_APIKEY },
    })
      .then((response) => response.json())
      .catch((error) => console.error(error));
    console.log(ships);
    ships = ships.data
      .filter((shipData) => shipData.scu > 0 && shipData.implemented == "1")
      .map((shipData) => {
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

async function fetchCommodities() {
  if (process.env.UEX_APIKEY && process.env.UEX_ENDPOINT) {
    const UEX_APIKEY = process.env.UEX_APIKEY;
    const UEX_ENDPOINT = process.env.UEX_ENDPOINT;
    const commodities = await fetch(UEX_ENDPOINT + "commodities", {
      headers: { api_key: UEX_APIKEY },
    }).then((response) => response.json());
    return commodities.data;
  }
}

async function fetchTradeports(systems) {
  if (process.env.UEX_APIKEY && process.env.UEX_ENDPOINT) {
    const UEX_APIKEY = process.env.UEX_APIKEY;
    const UEX_ENDPOINT = process.env.UEX_ENDPOINT;
    const publicData = {};
    publicData.systems = JSON.parse(
      readFileSync(join("data", "systemmap.json"), "utf-8")
    );

    const tradeports = await fetch(UEX_ENDPOINT + "tradeports", {
      headers: { api_key: UEX_APIKEY },
    }).then((response) => response.json());

    publicData.tradeports = tradeports.data;

    const fn = (tradeport) => {
      // tradeport system, planet, satellite, city
      const starsystem = publicData.systems.find(
        (c) => c.code == tradeport.system && c.trade != "1"
      );
      if (starsystem) {
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
    return publicData;
  }
}

app.listen(PORT, async () => {
  console.log("sc-manifest started on Port", PORT);
  if (process.env.refreshData) {
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
    publicData.commodities = await fetchCommodities();
    publicData.ships = await fetchShips();

    const d = await fetchTradeports();
    publicData.tradeports = d.tradeports;
    publicData.systems = d.systems;
    writeFileSync("publicdata.json", JSON.stringify(publicData), "utf-8");
  } else {
    console.log("no refresh issued, taking data from storage");
    publicData = JSON.parse(readFileSync("publicdata.json", "utf-8"));
  }

  if (!existsSync(join("data", "userdata.json"))) {
    const userData = {
      ships: [],
      manifests: [],
    };
    writeFileSync(
      join("data", "userdata.json"),
      JSON.stringify(userData),
      "utf-8"
    );
    console.log("set up new database");
  }

  console.log("everything is up and running");
});
