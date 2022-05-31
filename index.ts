import bodyParser from "body-parser";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from 'path';

import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
const swaggerFile = require('./swagger_output.json');


import { fetchCommodities, fetchShips, fetchTradeports } from './backend/fetcher';
import express, { Application } from "express";
import { PublicData } from "./backend/types";

import * as Manifest from './backend/manifest-handling';
import * as Ship from './backend/ship-handling';
import * as Commodities from './backend/commodities-handling';
import * as Authentication from './backend/authentication-handling';
import * as Shop from './backend/shop-handling';
import * as System from './backend/system-handling';

const app: Application = express();
const PORT = process.env.PORT;
let publicData: PublicData = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
const serverTiming = require('server-timing');

app.use(serverTiming());
app.use("/api", Ship.router);
app.use("/api", Manifest.router);
app.use("/api", Commodities.router);
app.use("/api", Authentication.router);
app.use("/api", Shop.router);
app.use("/api", System.router);

app.use('/api/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));

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
        publicData.tradeports = d?.tradeports;
        publicData.systems = d?.systems;
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
