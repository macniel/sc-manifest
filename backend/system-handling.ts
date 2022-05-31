import express, { Request, Response } from 'express';

export const router = express.Router();
import { findShop, findPOI, retrievePublicData } from './data-handling';
import { authenticateToken } from './authentication-handling';
import guid from 'guid';
import { PublicTradeport } from './types';
import { cacheResult } from './lookup-handling';

router.get('/system/', (req: any, res: any) => {
    res.startTime('request', 'processing');
    const path = req.query.path;

    if (path) {
        const result = cacheResult(path, () => {
            res.startTime('calculating');
            const system = retrievePublicData().systems.find((system: any) => system.code === path[0]);
            let walker = system;
            if (walker) {
                for (let i = 1; i < path.length; ++i) {
                    let child;
                    if (walker.children) {
                        child = walker.children.find((child: any) => child.code === path[i]);
                        if (child) {
                            walker = child;
                        }
                    }
                }
            }
            res.endTime('calculating');
            return walker;
        });
        res.endTime('request');
        return res.json(result);
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