import express, { Request, Response } from 'express';

export const router = express.Router();
import { findShop, findPOI, retrievePublicData, findPOIByPath } from './data-handling';
import { authenticateToken } from './authentication-handling';
import guid from 'guid';
import { PublicTradeport } from './types';
import { cacheResult } from './lookup-handling';

router.get('/system/', (req: any, res: any) => {
    
    const path = req.query.path;

    if (path) {
        
        const result = findPOIByPath(path);
        if (result) {
            return res.json(result);
        } else
            return res.sendStatus(404);
    }
    return res.sendStatus(404);
})

router.get('/system/resolve', (req, res) => {
    if (req.query.code) {
        if (!(req.query.code as string).charAt) {
            let bag = [...req.query.code as string[]].map(code => 
                cacheResult(code, () => findPOI(code))
            );
            res.json(bag);
        } else {
            const code = req.query.code as string;
            return res.json(cacheResult(code, () => findPOI(code)));
        }
    } else {
        return res.sendStatus(400);
    }
})