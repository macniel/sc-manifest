import React, { useEffect, useState } from 'react';
import ShipSelector from './ShipSelector';
import './RefiningView.css';
import NumberInput from './NumberInput';
import classNames from 'classnames';

function RefiningView(props) {

    const [volumes, setVolumes] = useState([]);
    const [selectedShip, setSelectedShip] = useState({});
    const [totalCSCU, setTotalCSCU] = useState(0);
    const [totalSum, setTotalSum] = useState(0);
    const [isValidTarget, setIsValidTarget] = useState(false);
    const [selectedCommodity, setSelectedCommodity] = useState({});
    const [demands, setDemands] = useState({});
    const [tempVolume, setTempVolume] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const oreList = await fetch('/api/ores').then((response) => response.json());
            setVolumes(oreList.map(o => {
                return {
                    code: o.code,
                    name: o.name,
                    kind: o.kind,
                    trade_price_sell: o.trade_price_sell,
                    modified: o.data_modified,
                    volume: 0
                }
            }));
        }
        fetchData();
    }, []);

    useEffect(() => {
        setTotalCSCU(volumes.reduce((previous, current) => previous + parseInt(current.volume || 0), 0));
        setTotalSum(volumes.reduce((previous, current) => previous + parseInt(current.volume || 0) * parseFloat(current.trade_price_sell), 0));
        if (selectedShip) {
            setIsValidTarget(volumes.reduce((previous, current) => previous + parseInt(current.volume || 0), 0) <= (selectedShip.scu - selectedShip.filled) * 100)
        }
    }, [volumes, selectedShip]);

    useEffect(() => {
        setDemands({ scu: { target: totalCSCU/100, op: 'ge' } })
    }, [totalCSCU]);
    
    const transferRefinedGoodsToShip = () => {
        let totalSCU = 0;
        let promises = volumes.filter(v => v.volume > 0).map(order => {
            const payload = {
                commodity: order.code,
                from: 'refinery',
                to: selectedShip.ship,
                quantity: order.volume,
                price: 0,
            };
            totalSCU += order.volume / 100;
            return fetch("/api/buy", {
                headers: { "Content-Type": "application/json" },
                method: "post",
                body: JSON.stringify(payload),
            })
        });
        Promise.allSettled(promises).then(() => {
            let temp = [...volumes];
            temp.forEach(t => t.volume = 0)
            setVolumes(temp);

            setSelectedCommodity({});

            setSelectedShip({});

            setTempVolume('');
            // TODO: update ship selector
        })
    };
    
    const setSelection = (commodity) => {
        setSelectedCommodity(commodity);
    }

    const addVolume = () => {
        let targetCommodity = volumes.find(v => v.code == selectedCommodity.code);
        
        if (targetCommodity) {
            targetCommodity.volume = parseInt(targetCommodity.volume) + parseInt(tempVolume);
            console.log(targetCommodity)
            let temp = [...volumes];
            temp.splice(volumes.findIndex(v => v.code === selectedCommodity.code), 1)

            setVolumes([ ...temp, targetCommodity])
            setTempVolume('');
        }
    }

    const removeVolume = () => {
  let targetCommodity = volumes.find(v => v.code === selectedCommodity.code);
        
        if (targetCommodity) {
            targetCommodity.volume = parseInt(targetCommodity.volume) - parseInt(tempVolume);
            console.log(targetCommodity)
            let temp = [...volumes];
            temp.splice(volumes.findIndex(v => v.code === selectedCommodity.code), 1)

            setVolumes([ ...temp, targetCommodity])
            setTempVolume(0);
        }
    }

    return (
         <div className="spatial-layout">
      <div className="rows">
        <fieldset className="main">
            <legend>Refined Materials</legend>
            <div>
            {volumes.sort((a, b) => b.trade_price_sell - a.trade_price_sell).map(ore => 
                <div className={classNames("commodity-row", { "active": ore.code === selectedCommodity.code })} key={ore.code} onClick={() => setSelection(ore)}>
                    <label><span className="name">{ore.name}</span>
                    <input type="number" className="unit" value={volumes.find(v => v.code === ore.code).volume} onChange={({target}) => {
                        let internalVolumes = [...volumes];
                        internalVolumes.find(v => v.code === ore.code).volume =target.value;
                        setVolumes(internalVolumes);
                    }} /><span>cSCU</span></label>
                    <span className="price">{ore.trade_price_sell?.toFixed(2)} aUEC</span>
                    <span className="subtotal">{((ore.volume || 0) * ore.trade_price_sell).toFixed(0)} aUEC</span>
                </div>
            )} 
                <div className="total--line"><span>Total Cargo</span>
                    <span className="unit">{ totalCSCU }</span> cSCU
                </div>
                <div className="total--line"><span>Estimated Sum</span>
                    <span className="unit">{totalSum.toFixed(0)}</span> aUEC
                </div>
            </div>
        </fieldset>
                <div className="sidebar">
                    <fieldset className="shipEntry">
                        <legend>Target Cargo Ship</legend>
                        <ShipSelector demands={demands} onChange={(ship) => { setSelectedShip(ship) }}></ShipSelector>
                    </fieldset>
                    <div className="lower-row">
                          <fieldset  className="quantity">
                            <legend>Add {selectedCommodity?.name ?? "Volume"}</legend>
                       <NumberInput min={0} value={tempVolume} onChange={setTempVolume}></NumberInput>
                    </fieldset>
                    </div>
                    <fieldset className="">
                        <legend>Actions</legend>
                        <div className="inner">
              <div className="status">
                                <span>{selectedShip?.name}</span>
                                <span>{selectedShip?.scu} Total SCU</span>
                                <span>{((selectedShip?.scu ?? 0) - (selectedShip?.filled ?? 0)).toFixed(2)} SCU left</span>
              </div> <button onClick={transferRefinedGoodsToShip} className="button--primary" disabled={!isValidTarget}>Transfer</button>
                            <span className="spacer" />
                            <button onClick={addVolume} disabled={parseInt(tempVolume) == 0} className="button--primary">+Volume</button>
                        <button onClick={removeVolume} disabled={parseInt(tempVolume) == 0} className="button--primary">-Volume</button>
                        </div>
                    </fieldset>
                    </div>
            </div>
            </div>
    );
}

export default RefiningView;