export const router = require('express').Router();
import guid from 'guid';
import { authenticateToken } from './authentication-handling';
import { findManifest, findShip, findCommodity, updateManifest, updateShip, findAllManifests } from './data-handling';
import { CommodityEntry, ManifestData, ShipData, TypedElement, TypedRequestBody } from './types';

router.get("/logs", authenticateToken, (req: any, res: any) => {
    let m: ManifestData[] = findAllManifests((manifest: ManifestData) => req.user.userid === manifest.owner && manifest.isArchived); 

    const costMapper = (c: any, m: ManifestData) => {
        let cost = 0;
        let profit = 0;
        if (m.transactions) {
            cost = Object.values(m.transactions).filter(v => v.code === c.code).reduce((value, currentValue) => value += (currentValue.price * currentValue.quantity), 0)
        }
        if (m.history) {
            profit = Object.values(m.history).filter(v => v.commodity === c.code).reduce((value, currentValue) => value += (currentValue.price * currentValue.quantity), 0)
        }
        return {cost, profit}
    }
    if (m) {
        m.forEach((m: ManifestData) => {
            m.associatedShip = findShip((ship: ShipData) => ship.ship === m.associatedShip)
            m.commodities = m.commodities.map(c => {
                return {
                    ...c,
                    ...costMapper(c, m),
                }
            })
        })
        
        
        res.send(JSON.stringify(m));
        return;
    }
    res.sendStatus(404);
})

router.get("/log/:manifest", (req: any, res: any) => {
    let m;
    if (m = findManifest((manifest:ManifestData) => req.params.manifest === manifest.manifest)) {
        res.send(JSON.stringify(m));
        return;
    }
    res.sendStatus(404);
});

router.get("/manifest/:manifestId", (req:any, res:any) => {
    let m;
    if (m = findManifest((manifest:ManifestData) => manifest.manifest === req.params.manifestId)) {
        res.send(JSON.stringify(m));
    } else {
        res.sendStatus(404);
    }
});

router.post("/archive", authenticateToken, (req:any, res:any) => {
    let manifest: ManifestData;
    if (manifest = findManifest((manifest:ManifestData) => req.body.manifest === manifest.manifest && manifest.owner === req.user.userid)) {
        // find corresponding ship
        let ship;
        if (ship = findShip((ship:ShipData) => {
            return ship.associatedManifest === manifest.manifest;
        })) {
            ship.associatedManifest = null;
            manifest.shipNameCopy = ship.shipsName || ship.name
            manifest.isArchived = true;
            manifest.associatedShip = ship.ship;
            updateShip(ship.ship, ship);
            updateManifest(manifest.manifest, manifest);
            return res.send(JSON.stringify(manifest));
        }
    }
    return res.sendStatus(404);
});

router.post("/sell", authenticateToken, (req: any, res: any) => {
    const envelope = req.body;
    const manifest: ManifestData = findManifest(
        (manifest:ManifestData) => manifest.manifest == envelope.manifest && manifest.owner === req.user.userid
    );

    // reduce capacity
    const commodity = manifest.commodities.find(
        (commodity) => commodity.code === req.body.commodity
    );

    if (!commodity || commodity.amount < envelope.quantity) {
        // selling commodity you dont have?!
        res.sendStatus(500);
        return;
    } else {
        commodity.amount -= envelope.quantity;
    }

    if (!manifest.history) {
        manifest.history = [];
    }

    manifest.history.push({
        destination: envelope.shop,
        quantity: parseInt(envelope.quantity),
        price: parseFloat(envelope.price),
        commodity: envelope.commodity,
        when: Date.now(),
    });

    manifest.profit =
        manifest.profit +
        parseInt(envelope.quantity) * parseFloat(envelope.price);
    
    updateManifest(manifest.manifest, manifest);

    let filled = 0;
    // get details for meter

    if (manifest) {
        manifest.commodities.forEach((commodity) => (filled += commodity.amount));
    }
    filled /= 100;

    res.send(
        JSON.stringify({
            manifest,
            filled,
        })
    );
});

type BuyBody = {
    to: string;
    quantity: string;
    price: string;
    commodity: string;
    from: string;
}

router.post("/buy", authenticateToken, (req: TypedRequestBody<BuyBody, any>, res: any) => {
    if (req.body.to) {
        let ship = findShip((ship: ShipData) => req.body.to === ship.ship);
        let manifest = findManifest(
            (manifest: ManifestData) => ship.associatedManifest === manifest.manifest
        );
        if (!manifest) { // prepopulate manifest
            manifest = {
                manifest: guid.raw(),
                transactions: [],
                commodities: [],
                owner: req.user?.userid,
                profit: 0,
            };
            ship.associatedManifest = manifest.manifest;
            updateShip(ship.ship, ship);
        }
        
            // calculate cost of buy
            manifest.profit -= parseInt(req.body.quantity) * parseFloat(req.body.price);
            manifest.transactions.push({
                code: req.body.commodity,
                source: req.body.from,
                destination: req.body.to,
                quantity: parseInt(req.body.quantity),
                price: parseFloat(req.body.price),
                when: Date.now(),
            });
            // find similar commodity to add
            let commodity = manifest.commodities.find(
                (commodity: CommodityEntry) => commodity.code === req.body.commodity
            );
            if (!commodity) {
                const template = findCommodity(
                    (c: CommodityEntry) => c.code === req.body.commodity
                );
                commodity = {
                    amount: 0,
                    total: 0,
                    code: template.code,
                    name: template.name,
                    kind: template.kind,
                };
                manifest.commodities.push(commodity);
            }
            commodity.amount += parseInt(req.body.quantity);
            commodity.total += parseInt(req.body.quantity);

            updateManifest(manifest.manifest, manifest);

            let filled = 0;
            // get details for meter

            if (manifest) {
                (manifest as ManifestData).commodities.forEach((commodity) => (filled += commodity.amount));
            }
            filled /= 100;

            res.send(
                JSON.stringify({
                    manifest,
                    filled,
                })
            );
        
    } else {
        res.sendStatus(400);
    }
});

router.post("/simulate-buy", authenticateToken, (req: any, res: any) => {
    if (req.body.to) {
        let ship:ShipData = findShip((ship: ShipData) => req.body.to === ship.ship);
        let manifest: ManifestData = findManifest(
            (manifest: ManifestData) => ship.associatedManifest === manifest.manifest
        );
        let totalCargoAvailable = ship.scu * 100;
        manifest?.commodities.forEach(
                (commodity) => totalCargoAvailable -= commodity.amount
        );
        if (totalCargoAvailable >= req.body.quantity)
            return res.json({"status": "success"});
        else
            return res.json({"status": "fail"});
    }
    return res.sendStatus(200);
})
