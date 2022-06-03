import express, { Request, Response } from 'express';

export const router = express.Router();
import { findShop, findPOI, retrievePublicData, findPOIByPath, updateWorkorder, findAllWorkorder, findWorkorder, findShip, findManifest, updateShip, findCommodity, updateManifest, deleteWorkorder } from './data-handling';
import { authenticateToken } from './authentication-handling';
import guid from 'guid';
import { CommodityEntry, ManifestData, PublicTradeport, ShipData, UserData, WorkorderData } from './types';
import { cacheResult } from './lookup-handling';


/**
 * Move Workorder to Manifest
 * this will delete the Workorder
 */
router.post('/buy/from-workorder/:workorderId', authenticateToken, (req, res) => {

    if (((req as any).user as UserData).userid) {
        
        // find order
        const workorder = req.params.workorderId;
        const foundWorkorder: WorkorderData = findWorkorder((wo: WorkorderData) => wo.workorder === workorder);

        // find manifest

        const shipId = (req as any).body.to;
        const foundShip: ShipData = findShip((ship: ShipData) => ship.ship === shipId);

        // transfer ores from workorder to manifest

        if (foundShip) {

            let actualManifest: ManifestData = findManifest((manifest: ManifestData) => manifest.manifest === foundShip.associatedManifest);
            const costOfWorkorder = foundWorkorder.setupCost;
        
            if (!actualManifest) { // prepopulate manifest
                actualManifest = {
                    manifest: guid.raw(),
                    commodities: [],
                    owner: (req as any).user.userid,
                    profit: 0,
                    isArchived: false,
                    history: [],
                    associatedShip: ''
                };
                foundShip.associatedManifest = actualManifest.manifest;
                updateShip(foundShip.ship as string, foundShip);
            }

            actualManifest.profit -= costOfWorkorder || 0;

            foundWorkorder.ores.forEach(ore => {
                // find commodity if any
                let commodity = actualManifest.commodities.find(
                    (commodity: CommodityEntry) => commodity.code === ore.code
                );
                const template: CommodityEntry = findCommodity(
                    (c: CommodityEntry) => c.code === ore.code
                );
                if (!commodity) {
                    commodity = {
                        amount: ore.volume,
                        code: template.code,
                        kind: template.kind as string,
                        name: template.name,
                        total: ore.volume
                    };
                    actualManifest.commodities.push(commodity);
                } else {
                    commodity.amount += ore.volume;
                    commodity.total += ore.volume;
                }
                
            });
            updateManifest(actualManifest.manifest, actualManifest);
            let filled = 0;
            // get details for meter

            if (actualManifest) {
                (actualManifest as ManifestData).commodities.forEach((commodity) => (filled += commodity.amount));
            }
            filled /= 100;

            deleteWorkorder(foundWorkorder.workorder);

            return res.json(
                {   
                    ownedWorkorder: findAllWorkorder( (wo: any) => wo.owner === foundWorkorder.owner),
                    actualManifest,
                    filled,
                }
            );
        }
    }
    return res.sendStatus(400);

})

router.delete('/workorder/:workorderId', authenticateToken, (req, res) => {
    if (((req as any).user as UserData).userid) {
        
        // find order
        const workorder = req.params.workorderId;
        const foundWorkorder: WorkorderData = findWorkorder((wo: WorkorderData) => wo.workorder === workorder);

        if (foundWorkorder) {
            deleteWorkorder(foundWorkorder.workorder);
             return res.json(
                {   
                    ownedWorkorder: findAllWorkorder( (wo: any) => wo.owner === foundWorkorder.owner)
            }
            );
        } else {
            return res.sendStatus(404);
        }
    }
    return res.sendStatus(400);
});

router.get('/workorder', authenticateToken, (req, res) => {
        
    if ((req as any).user.userid) {
        const userId = (req as any).user.userid;
        const all = findAllWorkorder((wo: WorkorderData) => wo.owner === userId);
        if (all) {
            return res.json(all);
        }
    }
    return res.sendStatus(400);
})

/**
 * Setup Workorder
 * returns workorderId
 */
router.post('/workorder', authenticateToken, (req, res) => {

    if (req.body.ores) {
        const workorder = req.body;
        workorder.workorder = guid.raw();
        workorder.owner = ((req as any).user as UserData).userid;
        const success = updateWorkorder(workorder.workorder, workorder);
        if (success) {
            return res.json(workorder);
        }
    }
    return res.sendStatus(400);

})