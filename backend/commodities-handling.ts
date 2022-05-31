import { findShop } from "./data-handling";
import { CommodityEntry } from "./types";

export const router = require('express').Router();
const { findAllCommodities, findCommodity } = require('./data-handling');
import { PublicTradeport } from './types';

router.get("/ores", (req: any, res: any) => {
    const refined = findAllCommodities( (c: CommodityEntry) => (c.kind == "Mineral" || c.kind == "Metal") && c.name.indexOf("(") === -1).filter((c: CommodityEntry) => !['HADA','APHO', 'DOLI'].includes(c.code)).map( (refined: CommodityEntry) => {
        return {
            code: refined.code,
            name: refined.name,
            kind: refined.kind,
            trade_price_sell: refined.trade_price_sell,
            data_modified: refined.data_modified
        }
    });
    return res.send(JSON.stringify(refined));
});

router.get("/commodities", (req: any, res: any) => {
    if (req.query?.from) {
        const shop: PublicTradeport = findShop((shop: PublicTradeport) => shop.code === req.query.from);
            let bag:any[] = [];
            Object.entries(shop.prices).map(([code, priceData]) => {
                if (req.query.mode === priceData.operation) {
                    bag.push({
                        code,
                        name: priceData.name,
                        operation: priceData.operation,
                        price_sell: priceData.price_sell,
                        price_buy: priceData.price_buy,
                        kind: priceData.kind
                    })
                }        
            })
        return res.send(JSON.stringify(bag));
    } else {
        return res.send(findAllCommodities());
    }
});
