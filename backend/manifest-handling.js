const router = require('express').Router();
const { findManifest, findShip } = require('./data-handling');

router.get("/log/:manifest", (req, res) => {
    let m;
    if (m = findManifest((manifest) => req.params.manifest === manifest.manifest)) {
        res.send(JSON.stringify(manifest));
        return;
    }
    res.sendStatus(404);
});

router.get("/manifest/:manifestId", (req, res) => {
    let m;
    if (m = findManifest((manifest) => manifest.manifest === req.params.manifestId)) {
        res.send(JSON.stringify(m));
    } else {
        res.sendStatus(404);
    }
});

router.post("/archive", (req, res) => {
    let userData = retrieveUserData();
    let manifest;
    if (manifest = findManifest((manifest) => req.body.manifest === manifest.manifest)) {
        // find corresponding ship
        let ship;
        if (ship = findShip((ship) => {
            return ship.associatedManifest === manifest.manifest;
        })) {
            ship.associatedManifest = null;
            manifest.isArchived = true;
            manifest.associatedShip = ship;
// TODO: fix this direct access
            writeFileSync(
                join("data", "userdata.json"),
                JSON.stringify(userData),
                "utf-8"
            );
            res.send(JSON.stringify(manifest));
        }
    } else {
        res.sendStatus(404);
    }
});

router.post("/sell", (req, res) => {
    console.log(req.body);
    let userData = retrieveUserData();
    const envelope = req.body;
    const manifest = userData.manifests.find(
        (manifest) => manifest.manifest == envelope.manifest
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

// TODO: fix this direct access
    writeFileSync(
        join("data", "userdata.json"),
        JSON.stringify(userData),
        "utf-8"
    );

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
router.post("/api/buy", (/** @type {BuyRequest} */ req, res) => {
    if (req.body.to) {
        let userData = retrieveUserData();


        const ship = userData.ships.find((ship) => req.body.to === ship.ship);
        let manifest = {};
        if (
            !ship.associatedManifest ||
            !userData.manifests.find(
                (manifest) => ship.associatedManifest === manifest.manifest
            )
        ) {
            manifest = {
                manifest: guid.raw(),
                transactions: [],
                commodities: [],
                profit: 0,
            };
            ship.associatedManifest = manifest.manifest;
            userData.manifests.push(manifest);
        } else {
            manifest = userData.manifests.find(
                (manifest) => ship.associatedManifest === manifest.manifest
            );
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
            (commodity) => commodity.code === req.body.commodity
        );
        if (!commodity) {
            const template = publicData.commodities.find(
                (c) => c.code === req.body.commodity
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
// TODO: fix this direct access
        writeFileSync(
            join("data", "userdata.json"),
            JSON.stringify(userData),
            "utf-8"
        );

        filled = 0;
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
    } else {
        res.sendStatus(400);
    }
});



module.exports = router;