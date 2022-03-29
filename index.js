const express = require("express");
const bodyParser = require("body-parser");
const { readFileSync, writeFileSync, existsSync, exists } = require("fs");
const { join } = require('path');

const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json');

const { fetchCommodities, fetchShips, fetchTradeports } = require('./backend/fetcher.js');

const app = express();
const PORT = process.env.PORT;
let publicData = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/api", require('./backend/ship-handling'));
app.use("/api", require('./backend/manifest-handling'));
app.use("/api", require('./backend/commodities-handling'));
app.use("/api", require('./backend/authentication-handling').router);

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))

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
// TODO: fix this direct access
        writeFileSync(join("data", "publicdata.json"), JSON.stringify(publicData), "utf-8");
    } else {
        console.log("no refresh issued, taking data from storage");
        publicData = JSON.parse(readFileSync(join("data", "publicdata.json"), "utf-8"));
    }
// TODO: fix this direct access
    if (!existsSync(join("data", "users.json"))) {
        writeFileSync(join("data", "users.json"), "[]", "utf-8")
    }
// TODO: fix this direct access
    if (!existsSync(join("data", "userdata.json"))) {
        const userData = {
            ships: [],
            manifests: [],
        };
// TODO: fix this direct access
        writeFileSync(
            join("data", "userdata.json"),
            JSON.stringify(userData),
            "utf-8"
        );
        console.log("set up new database");
    }

    console.log("everything is up and running");
});
