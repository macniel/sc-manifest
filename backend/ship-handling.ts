import express, { Request, Response } from 'express';
import { ShipData, ManifestData } from './types';
export const router = express.Router();
import { findShip, findAllShips, findRegistrarShip, findAllRegistrarShips, findManifest, insertShip, updateShip, retrieveUserData } from './data-handling';
import { authenticateToken } from './authentication-handling';
import guid from 'guid';

const appendFillMeter = (ship: ShipData) => {
    let filled = 0;
    // get details for meter
    if (ship.associatedManifest) {
        let manifest: ManifestData;
        if (manifest = findManifest((manifest: ManifestData) => manifest.manifest == ship.associatedManifest)) {
            manifest.commodities.forEach(
                (commodity) => (filled += commodity.amount)
            );
        }
        filled /= 100;
    }
    return { ...ship, filled };
}

router.get("/ships", authenticateToken, (req: any, res: any) => {
    res.json(findAllShips((ship:ShipData) => ship?.owner === req.user.userid));
});

router.get("/ship/:shipId", authenticateToken, (req, res) => {
    let found;
    if (found = findShip((ship:ShipData) => ship.ship === req.params.shipId)) {
        res.json(appendFillMeter(found));
    } else {
        res.sendStatus(404);
    }
});

router.delete("/ship/:shipId", authenticateToken,
    (req, res) => {
        let found;
        if (found = findShip((ship:ShipData) => ship.ship === req.params.shipId)) {
            updateShip(found.ship, null);
            return res.sendStatus(204);
        } 
        return res.sendStatus(404);
    });

router.patch("/ship/:shipId", authenticateToken,
    (req, res) => {
        let found;
        if (found = findShip((ship:ShipData) => ship.ship === req.params.shipId)) {
            if (req.body.name) {
                found.shipsName = req.body.name;
            }
            updateShip(found.ship, found);
            res.send(JSON.stringify(found));
        } else {
            res.sendStatus(403);
        }
    });

router.post("/ship", authenticateToken,
    (req: any, res: Response) => {
        const name = req.body.shipName;
        const actualShip = findRegistrarShip((ship: ShipData) => ship.code === req.body.code);
        let newShip: ShipData = {
            owner: req.user.userid,
            shipsName: name,
            name: actualShip.name,
            manufacturer: actualShip.manufacturer,
            scu: actualShip.scu,
            code: actualShip.code,
            associatedManifest: null,
            ship: guid.raw(),
        };
        insertShip(newShip);
        res.send(JSON.stringify(newShip));
    });
    
router.get("/ships/:shipId/manifest", (req: Request, res: Response) => {
    let userData = retrieveUserData();
    let ship: ShipData&{manifest: any};
    if (ship = userData.ships.find((ship:ShipData) => ship.ship === req.params.shipId)) {
        if (
            ship.associatedManifest &&
            userData.manifests.find((m: ManifestData) => m.manifest === ship.associatedManifest)
        ) {
            ship.manifest = userData.manifests.find(
                (m:ManifestData) => m.manifest === ship.associatedManifest
            );
            res.send(JSON.stringify(ship));
        }
    } else {
        res.sendStatus(404);
    }
});

router.get("/all-ships", (req, res) => {
    res.send(JSON.stringify(findAllRegistrarShips()));
});