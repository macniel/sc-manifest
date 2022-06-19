import React, { useEffect, useState } from 'react';
import ShipSelector from './ShipSelector';
import './RefiningView.css';
import NumberInput from './NumberInput';
import classNames from 'classnames';
import WorkorderSelector from './WorkorderSelector';
import { ReactComponent as SCUIcon } from '../assets/ui-scu.svg';

import { ReactComponent as OreIcon } from "../assets/metal.svg";
import { ReactComponent as GasIcon } from "../assets/foam.svg";
import { ReactComponent as GemsIcon } from "../assets/gems.svg";
import { ReactComponent as DrugsIcon } from "../assets/medicines.svg";
import { ReactComponent as MedicalIcon } from "../assets/hospital-cross.svg";
import { ReactComponent as FoodIcon } from "../assets/knife-fork.svg";
import { ReactComponent as AgriculturalIcon } from "../assets/wheat.svg";
import { ReactComponent as NaturalIcon } from "../assets/three-leaves.svg";
import { ReactComponent as WasteIcon } from "../assets/waste.svg";
import { ReactComponent as RecycleIcon } from "../assets/recycle.svg";
import TimeCodeInput from './TimeCodeInput';

function RefiningView({onCargoChange}) {

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
    const [timeCode, setTimeCode] = useState('');

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
                    setTimeCode('');
                    setTempWorkorderCost(0);
                    setWorkorderCost(0);
            setSelectedShip({});

            setTempVolume('');
                    onCargoChange?.();
            });
        }
    };
    
    const setSelection = (commodity, evt) => {
        if (selectedCommodity === commodity) {
            setSelectedCommodity({});
            setTempVolume(0);
            setMode('workordercost');
                        
        } else {
            setSelectedCommodity(commodity);
            setTempVolume(commodity.volume);
            setMode('commodity');
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
            setSelection({});
            setMode('workordercost');
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
            setSelection({});
            setMode('workordercost');
        }
    }

    const setupWorkorder = () => {
        const order = volumes.filter(v => v.volume > 0).map(v => {
            return {
                code: v.code,
                volume: v.volume
            }
        });
        const pattern = /((\d\d?)d)?\W*((\d\d?)h)?\W*((\d\d?)m)?\W*((\d\d?)s)?/;
        const [_, d, days, h, hours, m, minutes, s, seconds] = timeCode.match(pattern);
        fetch('/api/workorder', {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'post',
            body: JSON.stringify({ setupCost: workorderCost, ores: order, timeToFinish: {days, hours, minutes, seconds} })
        }).then(res => res.json()).then(res => {
            setWorkorders([...workorders, res.workorder]);
            setWorkorderCost(0);
            setTimeCode('');
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
            setTotalCSCU(workorder.ores.reduce((p, c) => p += parseInt(c.volume), 0));
            setWorkorderCost(workorder.setupCost);
            setTimeCode(workorder.timeToFinish);
            setMode('workorder');
        } else {
            setTotalCSCU(0)
            setWorkorderCost(0)
            setTempWorkorderCost(0)
            setTimeCode('');
            setMode('workordercost');
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
            setTimeCode('');
        })
    }

    const resetVolumes = () => {
        let resetVolumes = [ ...volumes ];
            resetVolumes?.forEach( v => v.volume = 0 )
            setVolumes(resetVolumes);
    }

    const [totalPending, setTotalPending] = useState(0);
    const [totalRefining, setTotalRefining] = useState(0);

    const externalWorkorders = (workorders) => {
        const now = Date.now()
        setTotalPending(workorders.filter(wo => wo.timeWhen - now <= 0).reduce((accumulator, workorder) => accumulator += parseInt(workorder.ores.reduce((wAccum, ore) => wAccum += parseInt(ore.volume), 0)), 0));
        setTotalRefining(workorders.filter(wo => wo.timeWhen - now > 0).reduce((accumulator, workorder) => accumulator += parseInt(workorder.ores.reduce((wAccum, ore) => wAccum += parseInt(ore.volume), 0)), 0));
    }

  const renderSvg = (kind) => {
    switch (kind) {
      case "metal":
        return <OreIcon />;
      case "gas":
      case "halogen":
        return <GasIcon />;
      case "mineral":
        return <GemsIcon />;
      case "drug":
      case "vice":
        return <DrugsIcon />;
      case "medical":
        return <MedicalIcon />;
      case "food":
        return <FoodIcon />;
      case "agricultural":
        return <AgriculturalIcon />;
      case "natural":
        return <NaturalIcon />;
      case "waste":
        return <WasteIcon />;
      case "junk":
      case "scrap":
      case "temporary":
      default:
        return <RecycleIcon />;
    }
    };
    
    const timeCodeToText = (code) => {
        if (code.days || code.hours || code.minutes || code.seconds) {
            let str = '';
            if (code.days) str += `${code.days}d`;
            if (code.hours) str += `${code.hours}h`;
            if (code.minutes) str += `${code.minutes}m`;
            if (code.seconds) str += `${code.seconds} s`;
            return str;
        } else {
            return code;
        }
    }

    const [mode, setMode] = useState('workordercost');
    const [tempTimeCode, setTempTimeCode] = useState({});

    const setTime = () => {
        setTimeCode(tempTimeCode);
        setTempTimeCode('');
        setMode('workordercost');
    }

    const getActionsOfMode = () => {
        switch (mode) {
            case 'commodity':
                return <>
                    <button className="button--primary" onClick={setupWorkorder}>Set Up</button>
                    <span className="spacer" />
                    <button onClick={addVolume} disabled={parseInt(tempVolume) === 0} className="button--primary">+Volume</button>
                    <button onClick={removeVolume} disabled={parseInt(tempVolume) === 0} className="button--primary">-Volume</button>
                </>
            default:
            case 'workordercost':
                return <>
                        <button className="button--primary" onClick={setupWorkorder}>Set Up</button>
                    <span className="spacer" />
                    <button onClick={() => setWorkorderCost(tempWorkorderCost)} disabled={parseInt(tempWorkorderCost) === 0} className="button--primary">Set Cost</button>        
                </>
            case 'workorder':
                return <>
                    <button className="button--primary" onClick={transferRefinedGoodsToShip}>Move</button>
                        <button className="button--harmful" onClick={discardWorkorder}>Discard</button>
                        <span className="spacer" />
                </>
            case 'workordertime':
                return <>
                        <button className="button--primary" onClick={setupWorkorder}>Set Up</button>
                    <span className="spacer" />
                    <button onClick={setTime} className="button--primary">Set Time</button>
                </>
        }                                
    }

    const renderVariableInput = () => {
        // eslint-disable-next-line default-case
        switch (mode) {
            case 'commodity':
                return <>
                    <legend>Add {selectedCommodity.name}</legend>
                    <NumberInput min={0} value={tempVolume} onChange={setTempVolume}/>
                </>
            case 'workordercost':
                return <>
                    <legend>Setup Cost</legend>
                    <NumberInput min={0} value={tempWorkorderCost} onChange={setTempWorkorderCost}/>
                </>
            case 'workordertime':
                return <>
                    <legend>Time to Refine</legend>
                    <TimeCodeInput value={tempTimeCode} onChange={setTempTimeCode}/>
                </>
        } 
    }

    return (
         <div className="spatial-layout">
            <div className="rows">
                <div className="col">
        <fieldset className="main">
                    <legend>Suitable Refinable Ores</legend>
                    <div className="list--scrollable">
                    <div className="commodity-matrix scrollcontent compact" style={{width: "auto"}}>
                         

            {volumes.sort((a, b) => b.trade_price_sell - a.trade_price_sell).map(ore => 
                <div className="commodity-container" key={ore.code}>
                <button className={classNames("commodity", { "active": ore.code === selectedCommodity.code, "selected": ore.volume > 0 })} onClick={(event) => {
                    setSelection(ore, event);
                        setTempWorkorderCost(0);
                        setTempTimeCode({});
                    
                }}>
                    {renderSvg(ore.kind.toLowerCase())}
                        <span className="commodity__label">{ore.name}</span>
                    <span className="commodity__price">{ore.trade_price_sell?.toFixed(2)}</span>
                </button></div>
                            )} 
                               </div>
                        
                    </div>
                </fieldset>
                <fieldset className="main">
                        <legend>Workorder</legend>
                        <div className="total--line"><span className="total--line__head">Content</span>
                            <div className="total--line__value no-flex">
                            <div className="pills">
                            {volumes.filter(o => o.volume > 0).sort((a, b) => a.volume - b.volume).map(ore => <span key={'wo'+ore.code} className="namedPill" title={ore.code}>{ore.volume}</span>)}
                            </div>                        

                            </div>
                            </div>
                        <div className="total--line" onClick={() => { setSelectedCommodity({}); setTempVolume(0); setTempTimeCode({}); setMode('workordercost'); }}>
                            <span className="total--line__head">Setup Cost</span>
                            <div className="total--line__value"><input disabled={workorder?.workorder} type="number" value={workorderCost} onChange={({ target }) => {
                                setWorkorderCost(target.value);
                            }}/><span className="total--line__value__unit">aUEC</span>
                                </div>
                            </div>
                        <div className="total--line" onClick={() => { setSelectedCommodity({}); setTempVolume(0); setTempTimeCode(timeCode); setMode('workordertime'); }}>
                            <span className="total--line__head">Refining Time</span>
                            <div className="total--line__value">
                            <input className="timeInput" type="string" disabled={workorder?.workorder} placeholder='2d 38m 12s' value={timeCodeToText(timeCode)} onChange={({ target }) => {
                                setTimeCode(timeCodeToText(target.value));
                                }}/>
                            </div>
                        </div>
                <div className="total--line"><span className="total--line__head">Total Cargo</span>
                    <span className="total--line__value">{ totalCSCU }<span className="total--line__value__unit">cSCU</span></span>
                </div>
                <div className="total--line"><span className="total--line__head">Estimated Sum</span>
                    <span className="total--line__value">{totalSum.toFixed(0)}<span className="total--line__value__unit">aUEC</span></span>
                        </div>
                        
                     
                        
            
                    </fieldset>
                    </div>
                <div className="sidebar">
                    <fieldset style={{flex: "1"}}>
                        <legend>Workorders</legend>
                        <div className="list--scrollable with-statusbar">
                            <div className="scrollcontent">
                                <WorkorderSelector onChange={updateSelectedWorkorder} workorder={workorders} onReady={externalWorkorders} onUpdate={externalWorkorders} />
                                </div>
                        </div>
                        <div className="statusbar">
                            <span className="status-right">{Math.ceil(totalPending / 100)} <SCUIcon width="24px" height="24px" /></span>
                            <span style={{opacity: 0.5}} className="status-right">{Math.ceil(totalRefining/100)} <SCUIcon width="24px" height="24px" /></span>
                        </div>
                    </fieldset>
                    {workorder?.workorder ?
                    <fieldset className="shipEntry">
                        <legend>Target Cargo Ship</legend>
                        <ShipSelector selected={selectedShip} demands={demands} onChange={(ship) => { setSelectedShip(ship) }}></ShipSelector>
                    </fieldset> : <></>
                    }
                    { workorder?.workorder ? <></> : <div className="lower-row">
                        <fieldset className="quantity">
                            {renderVariableInput()}
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
                            {getActionsOfMode()}                            
                        </div>
                    </fieldset>
                    </div>
            </div>
            </div>
    );
}

export default RefiningView;