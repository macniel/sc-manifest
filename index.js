const express = require("express");
const { existSync, readFileSync, writeFileSync } = require("fs");
const bodyParser = require("body-parser");
const { join } = require("path");
const { engine } = require("express-handlebars");
const fetch = require("node-fetch");
const guid = require("guid");

const app = express();
const PORT = 80;
const publicData = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
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
    commodityListing: JSON.stringify(publicData.commodities),
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

app.delete("/dump", (req, res) => {
  console.log(req.body);
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  userData.transactions = userData.transactions.filter(
    (manifestItem) => manifestItem.transaction != req.body.transaction
  );
  writeFileSync(
    join("data", "userdata.json"),
    JSON.stringify(userData),
    "utf-8"
  );
  res.send(JSON.stringify(userData.transactions));
});

app.post("/seal-manifest", (req, res) => {
  console.log(req.body);
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );

  const envelope = req.body;
  const transactionItems = userData.transactions.filter(
    (manifestItem) => !manifestItem.isArchived
  );
  const sealedManifest = [];
  transactionItems.forEach((tx) => {
    const smtx = sealedManifest.find((smtx) => smtx.commodity == tx.commodity);
    if (smtx) {
      smtx.source = "";
      smtx.quantity += parseInt(tx.quantity);
      smtx.transaction = guid.raw();
      smtx.price += parseFloat(tx.quantity) * parseFloat(tx.price);
      smtx.profit += tx.profit;
    } else {
      sealedManifest.push({
        source: "",
        commodity: tx.commodity,
        quantity: parseInt(tx.quantity),
        transaction: guid.raw(),
        price: parseFloat(tx.quantity) * parseFloat(tx.price),
        profit: tx.profit,
      });
    }
  });
  userData.transactions = sealedManifest;
  writeFileSync(
    join("data", "userdata.json"),
    JSON.stringify(userData),
    "utf-8"
  );
  res.send(JSON.stringify(userData.transactions));
});

app.post("/archive", (req, res) => {
  console.log(req.body);
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );

  const envelope = req.body;
  const transactionItems = userData.transactions.filter(
    (manifestItem) => !manifestItem.isArchived
  );
  const newManifest = {
    manifest: guid.raw(),
    transactions: [],
    volume: 0,
    profit: 0,
    commodities: [],
  };
  if (transactionItems) {
    transactionItems.forEach((transactionItem) => {
      transactionItem.isArchived = true;

      newManifest.commodities.push({
        code: transactionItem.commodity,
        volume: transactionItem.quantity,
      });
      newManifest.volume += parseInt(transactionItem.quantity);

      const stops =
        transactionItem.shop +
        " TO " +
        transactionItem.history
          .map((historyline) => historyline.destination)
          .join(", ");
      transactionItem.stops = stops;

      if (transactionItem.profit) {
        newManifest.profit += parseFloat(transactionItem.profit);
      } else {
        const buy =
          parseFloat(transactionItem.quantity) *
          parseFloat(transactionItem.price);
        transactionItem.profit = -buy;
        transactionItem.history.forEach((historyline) => {
          transactionItem.profit +=
            parseFloat(historyline.quantity) * parseFloat(historyline.price);
        });
        newManifest.profit += parseFloat(buy);
      }
      newManifest.timestamp = Date.now();
      newManifest.transactions.push(transactionItem);
    });
    if (!userData.manifests) {
      userData.manifests = [];
    }
    userData.manifests.push(newManifest);
    console.log(userData);
    writeFileSync(
      join("data", "userdata.json"),
      JSON.stringify(userData),
      "utf-8"
    );
    res.send(JSON.stringify(userData));
  }
});

app.post("/sell", (req, res) => {
  console.log(req.body);
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  const envelope = req.body;
  const transactionItem = userData.transactions.find(
    (manifestItem) => manifestItem.transaction == envelope.transaction
  );
  console.log(transactionItem);
  if (transactionItem) {
    if (!transactionItem.history) {
      transactionItem.history = [];
    }
    transactionItem.history.push({
      destination: envelope.shop,
      quantity: envelope.quantity,
      price: envelope.price,
    });
  }
  console.log(userData);
  writeFileSync(
    join("data", "userdata.json"),
    JSON.stringify(userData),
    "utf-8"
  );
  res.send(JSON.stringify(userData));
});

app.post("/buy", (req, res) => {
  console.log(req.body);
  let userData = JSON.parse(
    readFileSync(join("data", "userdata.json"), "utf-8")
  );
  if (!userData) {
    userData = {};
  }
  if (!userData.transactions) {
    userData.transactions = [];
  }
  userData.transactions.push({
    commodity: req.body.commodity,
    shop: req.body.shop || "unknown",
    quantity: req.body.qty || 0,
    price: req.body.price || 0,
    transaction: guid.raw(),
  });
  writeFileSync(
    join("data", "userdata.json"),
    JSON.stringify(userData),
    "utf-8"
  );
  res.send(JSON.stringify(userData.transactions));
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
