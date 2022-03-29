const express = require("express");
const { readFileSync, writeFileSync, existsSync, exists } = require("fs");
const bodyParser = require("body-parser");
const { join } = require("path");
const { engine } = require("express-handlebars");
const fetch = require("node-fetch");
const guid = require("guid");
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT;
let publicData = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/api/ship/:shipId", authenticateToken, (req, res) => {
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  if (!userData.ships) {
    userData.ships = [];
  }

  const found = userData.ships.find((ship) => ship.ship === req.params.shipId);
  if (found) {
    found.filled = 0;
    // get details for meter
    if (found.associatedManifest) {
      const manifest = userData.manifests.find(
        (manifest) => manifest.manifest == found.associatedManifest
      );
      if (manifest) {
        manifest.commodities.forEach(
          (commodity) => (found.filled += commodity.amount)
        );
      }
      found.filled /= 100;
    }

    res.send(JSON.stringify(found));
  } else {
    res.sendStatus(404);
  }
});

app.post("/api/ship",
  (req, res) => {
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

app.get("/api/manifest/:manifestId", (req, res) => {
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

app.get("/api/ores", (req, res) => {
  if (publicData.commodities) {
    const refined = publicData.commodities.filter(c => c.kind == "Mineral" || c.kind == "Metal").filter(c => c.name.indexOf("(") === -1).map(refined => {
      return {
        code: refined.code,
        name: refined.name,
        kind: refined.kind,
        trade_price_sell: refined.trade_price_sell,
        data_modified: refined.data_modified
      }
    });
    return res.send(JSON.stringify(refined));   
  }
  res.send(404);
});

app.get("/api/commodities", (req, res) => {
  if (publicData.commodities) {
    return res.send(publicData.commodities);
  }
});

app.get("/api/ships/:shipId/manifest", (req, res) => {
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

app.get("/api/log/:manifest", (req, res) => {
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

app.post("/api/archive", (req, res) => {
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

app.post("/api/sell", (req, res) => {
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
    when: Date.now(),
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

  let filled = 0;
  // get details for meter

  if (manifest) {
    manifest.commodities.forEach((commodity) => (filled += commodity.amount));
  }
  filled /= 100;

  res.send(
    JSON.stringify({
      manifest,
      filled,
    })
  );
});

function authenticateToken(req, res, next) {
  const token = req.cookies.auth;
  if (token == null) return res.sendStatus(401)
  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)

    // check if user exists in database
    let users = JSON.parse(readFileSync(join("data", "users.json"), "utf-8"));
    
    const userObject = users.find(u => u.username === user.username && u.userid === user.userid);

    if (!userObject) {
      return res.sendStatus(404);
    }
    req.user = userObject
    next()
  })
}

app.post("/api/login", (req, res) => {
  if (!req.body.username) return res.sendStatus(401);
  if (!req.body.password) return res.sendStatus(401);
  let users = JSON.parse(readFileSync(join("data", "users.json"), "utf-8"));
  const userObject = users.find(u => u.username === req.body.username && bcrypt.compareSync(req.body.password, u.hashedPassword));
  if (!userObject) return res.sendStatus(401);
  const token = jwt.sign({ username: userObject.username, userid: userObject.userid }, process.env.TOKEN_SECRET, { expiresIn: '1 day' })
  res.cookie("auth", token, { httpOnly: true });
  res.sendStatus(200);
})

app.post("/api/register", (req, res) => {
  console.log(req.body);
  if (!req.body.username) return res.sendStatus(400);
  if (!req.body.password) return res.sendStatus(400);
  const uuid = guid.raw();
  
  let users = JSON.parse(readFileSync(join("data", "users.json"), "utf-8"));
  const userObject = users.find(u => u.username === req.body.username);
  if (userObject) return res.sendStatus(403);
  users.push({
    username: req.body.username,
    userid: uuid,
    hashedPassword: bcrypt.hashSync(req.body.password, 10)
  });
  writeFileSync(join("data", "users.json"), JSON.stringify(users), "utf-8");
  
  const token = jwt.sign({ username: req.body.username, userid: uuid }, process.env.TOKEN_SECRET, { expiresIn: '1 day' })
  res.cookie("auth", token, { httpOnly: true });
  res.sendStatus(200);
})

app.get("/api/logout", (req, res) => {
  
})

app.get("/api/verify", authenticateToken, (req, res) => {
  console.log(req.user)
  res.json(req.user)
})


/**
 * @typedef BuyRequest
 * @property {BuyRequestBody} body
 */

/**
 * @typedef BuyRequestBody
 * @property {ShipId} to the target ship
 * @property {number} quantity the amount of commodity that should be bought
 * @property {number} price of the bought commodity per unit
 * @property {CommodityId} commodity which should be bought
 * @property {ShopId} from a shop
 */

/**
 * @typedef CommodityId
 * A four letter code associated with a Commodity e.g. HADA - Hadanite, QUAN - Quantanium, AGRI - Agricultural Supplies
 */

/**
 * @typedef ShipId
 * A uuid assigned to a ship on creation
 */
/**
 * @function
 */
app.post("/api/buy", (/** @type {BuyRequest} */ req, res) => {
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
      when: Date.now(),
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

    filled = 0;
    // get details for meter

    if (manifest) {
      manifest.commodities.forEach((commodity) => (filled += commodity.amount));
    }
    filled /= 100;

    res.send(
      JSON.stringify({
        manifest,
        filled,
      })
    );
  } else {
    res.sendStatus(400);
  }
});


app.get("/api/ships", (req, res) => {
  res.send(JSON.stringify(publicData.ships));
});

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))

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

  if (!existsSync(join("data", "users.json"))) {
    writeFileSync(join("data", "users.json"), "[]", "utf-8")
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
