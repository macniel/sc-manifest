export const router = require('express').Router();
import guid from 'guid';
import { authenticateToken } from './authentication-handling';
import { findManifest, findShip, findCommodity, updateManifest, updateShip, findAllManifests } from './data-handling';
import { CommodityEntry, ManifestData, ShipData } from './types';

router.get("/logs", authenticateToken, (req: any, res: any) => {
    let m = findAllManifests((manifest: ManifestData) => req.user.userid === manifest.owner && manifest.isArchived); 
    console.log(m);
    if (m) {
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
            manifest.isArchived = true;
            manifest.associatedShip = ship.ship;
            updateShip(ship.ship, ship);
            updateManifest(manifest.manifest, manifest);
            res.send(JSON.stringify(manifest));
        }
    }
    res.sendStatus(404);
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
        parseFloat(manifest.profit) +
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

/**
 * @typedef BuyRequest
 * @property {BuyRequestBody} body
 */

/**
 * @typedef BuyRequestBody
 * @property {ShipId} to the target ship
 * @property {number} quantity the amount of commodity that should be bought
 * @property {number} price of the bought commodity per unit
 * @property {CommodityId} commodity which should be bought
 * @property {ShopId} from a shop
 */

/**
 * @typedef CommodityId
 * A four letter code associated with a Commodity e.g. HADA - Hadanite, QUAN - Quantanium, AGRI - Agricultural Supplies
 */

/**
 * @typedef ShipId
 * A uuid assigned to a ship on creation
 */
/**
 * @function
 */
router.post("/buy", authenticateToken, (/** @type {BuyRequest} */ req: any, res: any) => {
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
                owner: req.user.userid,
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
                quantity: req.body.quantity,
                price: req.body.price,
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
