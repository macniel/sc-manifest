import express, { Request, Response } from 'express';

export const router = express.Router();
import { findShop, findPOI, retrievePublicData } from './data-handling';
import { authenticateToken } from './authentication-handling';
import guid from 'guid';
import { PublicTradeport } from './types';

router.get('/system/', (req: any, res: any) => {

    const path = req.query.path;
    if (path) {
        const system = retrievePublicData().systems.find((system: any) => system.code === path[0]);
        if (system) {
            let walker = system;
            for (let i = 1; i < path.length; ++i) {
                if (walker.children) {
                    const child = walker.children.find((child: any) => child.code === path[i]);
                    if (child) {
                        walker = child;
                    }
                }
            }
            return res.json(walker);
        }
    }
    return res.sendStatus(404);
})

router.get('/system/resolve', (req, res) => {
    if (req.query.code) {
        const code = req.query.code as string;
        return res.json(findPOI(code));
    } else {
        return res.sendStatus(400);
    }
})