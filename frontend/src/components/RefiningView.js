import React, { useEffect, useState } from 'react';
import ShipSelector from './ShipSelector';
import './RefiningView.css';
import NumberInput from './NumberInput';
import classNames from 'classnames';
import WorkorderSelector from './WorkorderSelector';

function RefiningView(props) {

    const [volumes, setVolumes] = useState([]);
    const [selectedShip, setSelectedShip] = useState({});
    const [workorders, setWorkorders] = useState([]);
    const [totalCSCU, setTotalCSCU] = useState(0);
    const [totalSum, setTotalSum] = useState(0);
    const [workorderCost, setWorkorderCost] = useState(0);
    const [tempWorkorderCost, setTempWorkorderCost] = useState(0);
    const [selectedCommodity, setSelectedCommodity] = useState({});
    const [demands, setDemands] = useState({});
    const [tempVolume, setTempVolume] = useState('');
    const [workorder, setWorkorder] = useState({});

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
    }, [volumes, selectedShip]);

    useEffect(() => {
        setDemands({ scu: { target: totalCSCU/100, op: 'ge' } })
    }, [totalCSCU]);
    
    const transferRefinedGoodsToShip = () => {
        
        // move workorder to selected ship

        if (workorder) {
            const payload = {
                workorder: workorder.workorder,
                to: selectedShip.ship,
            }
            return fetch("/api/buy/from-workorder/" + workorder.workorder,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method: 'post',
                body: JSON.stringify(payload)}).then(res => res.json()).then(res => {
                           let temp = [...volumes];
                    temp.forEach(t => t.volume = 0)
            setVolumes(temp);
            
                    setWorkorders(res.ownedWorkorder);
                    setWorkorder({});
            setSelectedCommodity({});
                    resetVolumes();
                    setTotalCSCU(0);
                    setTotalSum(0);
                    setTempWorkorderCost(0);
                    setWorkorderCost(0);
            setSelectedShip({});

            setTempVolume('');

            });
        }
    };
    
    const setSelection = (commodity, evt) => {
        if (selectedCommodity === commodity) {
            setSelectedCommodity({});
            setTempVolume(0);
        } else {
            setSelectedCommodity(commodity);
            setTempVolume(commodity.volume);
        }
        
    }

    const addVolume = () => {
        let targetCommodity = volumes.find(v => v.code === selectedCommodity.code);
        
        if (targetCommodity) {
            targetCommodity.volume = parseInt(targetCommodity.volume) + parseInt(tempVolume);
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
            let temp = [...volumes];
            temp.splice(volumes.findIndex(v => v.code === selectedCommodity.code), 1)

            setVolumes([ ...temp, targetCommodity])
            setTempVolume(0);
        }
    }

    const setupWorkorder = () => {
        const order = volumes.filter(v => v.volume > 0).map(v => {
            return {
                code: v.code,
                volume: v.volume
            }
        });
        fetch('/api/workorder', {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'post',
            body: JSON.stringify({ setupCost: workorderCost, ores: order })
        }).then(res => res.json()).then(res => {
            setWorkorders([...workorders, res.workorder]);
            setWorkorderCost(0);
            resetVolumes();
        })
    }

    const updateSelectedWorkorder = (workorder) => {
        setWorkorder(workorder);
        volumes.forEach(vol => vol.volume = 0)
        if (workorder) {
            // reset volumes
            workorder.ores.forEach(ore => {
                const vol = volumes.find(v => v.code === ore.code);
                if (vol) {
                    vol.volume = ore.volume
                }
            })
            setTotalCSCU(workorder.ores.reduce((p, c) => p += parseInt(c.volume), 0))
            setWorkorderCost(workorder.setupCost)
        } else {
            setTotalCSCU(0)
            setWorkorderCost(0)
            setTempWorkorderCost(0)
        }
        setTotalSum(volumes.reduce((previous, current) => previous + parseInt(current.volume || 0) * parseFloat(current.trade_price_sell), 0));
    }

    const discardWorkorder = () => {
        fetch('/api/workorder/' + workorder.workorder, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'delete',
        }).then(res => res.json()).then(res => {
            setWorkorders([...workorders, res.workorder]);
            setWorkorder({});
            resetVolumes();
            setSelectedShip({});
            setWorkorderCost(0);
            setTempWorkorderCost(0);
            setTotalCSCU(0);
                    setTotalSum(0);
        })
    }

    const resetVolumes = () => {
        let resetVolumes = [ ...volumes ];
            resetVolumes?.forEach( v => v.volume = 0 )
            setVolumes(resetVolumes);
    }

    return (
         <div className="spatial-layout">
      <div className="rows">
        <fieldset className="main">
            <legend>Workorder</legend>
            <div>
            {volumes.sort((a, b) => b.trade_price_sell - a.trade_price_sell).map(ore => 
                <div className={classNames("commodity-row", { "active": ore.code === selectedCommodity.code })} key={ore.code} onClick={(event) => {
                    setSelection(ore, event);
                    
                    
                }}>
                    <label><span className="name" onClick={(event) => event.stopPropagation() }>{ore.name}</span>
                    <input disabled={workorder?.workorder} type="number" className="unit" value={ore.volume} onChange={({target}) => {
                        let internalVolumes = [...volumes];
                        internalVolumes.find(v => v.code === ore.code).volume =target.value;
                        setVolumes(internalVolumes);
                    }} /><span>cSCU</span></label>
                    <span className="price">{ore.trade_price_sell?.toFixed(2)} aUEC</span>
                    <span className="subtotal">{((ore.volume || 0) * ore.trade_price_sell).toFixed(0)} aUEC</span>
                </div>
                        )} 
                        <div className="total--line"><span>Setup Cost</span>
                            <input disabled={workorder?.workorder} type="number" className="unit" value={workorderCost} onChange={({ target }) => {
                                setWorkorderCost(target.value);
                            }}/><span>aUEC</span>
                        </div>
                <div className="total--line"><span>Total Cargo</span>
                    <span className="unit">{ totalCSCU }</span> cSCU
                </div>
                <div className="total--line"><span>Estimated Sum</span>
                    <span className="unit">{totalSum.toFixed(0)}</span> aUEC
                </div>
            </div>
        </fieldset>
                <div className="sidebar">
                    <fieldset style={{flex: "1"}}>
                        <legend>Workorders</legend>
                        <div className="list--scrollable">
                            <div className="scrollcontent">
                                <WorkorderSelector onChange={updateSelectedWorkorder} workorder={workorders} />
                                </div>
                            </div>
                    </fieldset>
                    {workorder?.workorder ?
                    <fieldset className="shipEntry">
                        <legend>Target Cargo Ship</legend>
                        <ShipSelector demands={demands} onChange={(ship) => { setSelectedShip(ship) }}></ShipSelector>
                    </fieldset> : <></>
                    }
                    { workorder?.workorder ? <></> : <div className="lower-row">
                        <fieldset className="quantity">
                            <legend>{selectedCommodity?.name ? ('Add ' + selectedCommodity.name) : "Setup Cost"}</legend>
                            <NumberInput min={0} value={selectedCommodity.code ? tempVolume : tempWorkorderCost} onChange={(v) => {
                                if (selectedCommodity?.name)
                                    setTempVolume(v)
                                else
                                    setTempWorkorderCost(v)
                            }}></NumberInput>
                        </fieldset>
                    </div>}
                    <fieldset className="">
                        <legend>Actions</legend>
                        <div className="inner">
              <div className="status">
                                <span>{selectedShip?.name}</span>
                                <span>{selectedShip?.scu} Total SCU</span>
                                <span>{((selectedShip?.scu ?? 0) - (selectedShip?.filled ?? 0)).toFixed(2)} SCU left</span>
                            </div>
                            {!workorder?.workorder ?
                                <>
                                    <button className="button--primary" onClick={setupWorkorder}>Set Up</button>
                                    
                                    
                                    <span className="spacer" />
                                    {selectedCommodity?.name ? 
                                        <>
                                               <button onClick={addVolume} disabled={parseInt(tempVolume) === 0} className="button--primary">+Volume</button>
                                    <button onClick={removeVolume} disabled={parseInt(tempVolume) === 0} className="button--primary">-Volume</button>
                                        </> : <>
                                            <button onClick={() => setWorkorderCost(tempWorkorderCost)} disabled={parseInt(tempWorkorderCost) === 0} className="button--primary">Set Cost</button>        
                                    </>}
                                  
                                      
                                    
                                </>:
                                <>
                                    <button className="button--primary" onClick={transferRefinedGoodsToShip}>Move</button>
                                    <button className="button--harmful" onClick={discardWorkorder}>Discard</button>
                                    <span className="spacer" />
                         
                                </>}
                            
                        </div>
                    </fieldset>
                    </div>
            </div>
            </div>
    );
}

export default RefiningView;