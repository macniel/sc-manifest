"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const fs_1 = require("fs");
const path_1 = require("path");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swaggerFile = require('./swagger_output.json');
const fetcher_1 = require("./backend/fetcher");
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = process.env.PORT;
let publicData = {};
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/api", require('./backend/ship-handling'));
app.use("/api", require('./backend/manifest-handling'));
app.use("/api", require('./backend/commodities-handling'));
app.use("/api", require('./backend/authentication-handling').router);
app.use('/api/doc', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerFile));
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("sc-manifest started on Port", PORT);
    if (process.env.refreshData) {
        if (process.env.UEX_APIKEY) {
            console.log("UEXcorp APIKEY set");
        }
        else {
            console.error("apikey not found");
        }
        if (process.env.UEX_ENDPOINT) {
            console.log("UEXcorp endpoint set");
        }
        else {
            console.error("endpoint not found");
        }
        publicData.commodities = yield (0, fetcher_1.fetchCommodities)();
        publicData.ships = yield (0, fetcher_1.fetchShips)();
        const d = yield (0, fetcher_1.fetchTradeports)();
        publicData.tradeports = d === null || d === void 0 ? void 0 : d.tradeports;
        publicData.systems = d === null || d === void 0 ? void 0 : d.systems;
        // TODO: fix this direct access
        (0, fs_1.writeFileSync)((0, path_1.join)("data", "publicdata.json"), JSON.stringify(publicData), "utf-8");
    }
    else {
        console.log("no refresh issued, taking data from storage");
        publicData = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)("data", "publicdata.json"), "utf-8"));
    }
    // TODO: fix this direct access
    if (!(0, fs_1.existsSync)((0, path_1.join)("data", "users.json"))) {
        (0, fs_1.writeFileSync)((0, path_1.join)("data", "users.json"), "[]", "utf-8");
    }
    // TODO: fix this direct access
    if (!(0, fs_1.existsSync)((0, path_1.join)("data", "userdata.json"))) {
        const userData = {
            ships: [],
            manifests: [],
        };
        // TODO: fix this direct access
        (0, fs_1.writeFileSync)((0, path_1.join)("data", "userdata.json"), JSON.stringify(userData), "utf-8");
        console.log("set up new database");
    }
    console.log("everything is up and running");
}));
