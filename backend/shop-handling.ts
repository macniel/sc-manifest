import express, { Request, Response } from 'express';

export const router = express.Router();
import { findShop, findPOI } from './data-handling';
import { authenticateToken } from './authentication-handling';
import guid from 'guid';
import { PublicTradeport } from './types';

router.get('/shop/:shopCode', (req: any, res: any) => {
    if (req.params.shopCode) {

        const shop: PublicTradeport = findShop((shop: PublicTradeport) => shop.code === req.params.shopCode);
        if (shop) {
            // expand shop data
            let data = [];
            if (shop.system) data.push(findPOI(shop.system));
            if (shop.planet) data.push(findPOI(shop.planet));
            if (shop.satellite) data.push(findPOI(shop.satellite));
            if (shop.city) data.push(findPOI(shop.city));
            const actualShop = findPOI(shop.code)
            data.push({
                ...shop,
                type: actualShop?.type
            });
            return res.json(data);
        } else {
            return res.sendStatus(404);
        }
    }
    return res.sendStatus(404);
})