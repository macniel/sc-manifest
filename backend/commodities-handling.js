const router = require('express').Router();
const { findAllCommodities, findCommodity } = require('./data-handling');

router.get("/ores", (req, res) => {
    const refined = findAllCommodities(c => (c.kind == "Mineral" || c.kind == "Metal") && c.name.indexOf("(") === -1).map(refined => {
        return {
            code: refined.code,
            name: refined.name,
            kind: refined.kind,
            trade_price_sell: refined.trade_price_sell,
            data_modified: refined.data_modified
        }
    });
    return res.send(JSON.stringify(refined));
});

router.get("/commodities", (req, res) => {
    return res.send(findAllCommodities());
});

module.exports = router;