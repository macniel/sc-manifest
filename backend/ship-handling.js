const express = require('express');
const router = express.Router();
const { findShip, findAllShips, findRegistrarShip, findAllRegistrarShips, findManifest, insertShip } = require('./data-handling.js');
const { authenticateToken } = require('./authentication-handling');
const guid = require('guid');

const appendFillMeter = (ship) => {
    let filled = 0;
    // get details for meter
    if (ship.associatedManifest) {
        let manifest;
        if (manifest = findManifest((manifest) => manifest.manifest == ship.associatedManifest)) {
            manifest.commodities.forEach(
                (commodity) => (filled += commodity.amount)
            );
        }
        filled /= 100;
    }
    return { ...ship, filled };
}

router.get("/ships", authenticateToken, (req, res) => {
    res.json(findAllShips(ship => ship.owner === req.user.userid));
});

router.get("/ship/:shipId", authenticateToken, (req, res) => {
    console.log(req.params.shipId);
    let found;
    if (found = findShip((ship) => ship.ship === req.params.shipId)) {
        res.json(appendFillMeter(found));
    } else {
        res.sendStatus(404);
    }
});

router.post("/ship", authenticateToken,
    (req, res) => {
        const name = req.body.shipName;
        const actualShip = findRegistrarShip((ship) => ship.code === req.body.code);
        let newShip = {
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
    
router.get("/ships/:shipId/manifest", (req, res) => {
    let userData = retrieveUserData();
    if (userData.ships.find((ship) => ship.ship === req.params.shipId)) {
        if (
            ship.associatedManifest &&
            userData.manifests.find((m) => m.manifest === ship.associatedManifest)
        ) {
            ship.manifest = userData.manifests.find(
                (m) => m.manifest === ship.associatedManifest
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

module.exports = router;