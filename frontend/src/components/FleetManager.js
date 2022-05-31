import classNames from "classnames";
import { useEffect, useState } from "react";
import "./FleetManager.css";
// import ShipSelector from "./ShipSelector";

function FleetManager({ onFleetUpdate }) {
  const [ships, setShips] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [shipName, setShipName] = useState("");
  // const [shipNewName, setShipNewName] = useState("");
  // const [shipNew, setShipNew] = useState(null);

  const addShip = () => {
    fetch("/api/ship", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipName: shipName,
        code: selectedShip.code,
      }),
    })
      .then((response) => response.json())
      .then((newShip) => {
        onFleetUpdate?.();
        let shipList = localStorage.getItem("ships");

        if (!shipList) {
          shipList = "[]";
        }
        const l = JSON.parse(shipList);
        l.push(newShip.ship);
        localStorage.setItem("ships", JSON.stringify(l));
        setSelectedShip(null);
        setShipName("");
      });
  };

  const selectShip = (ship) => {
    setSelectedShip(ship);
    setShipName(ship.name);
  };

  useEffect(() => {
    fetch("/api/all-ships")
      .then((response) => response.json())
      .then(setShips);
  }, []);

  /*const shipChanged = (ship) => {
    setShipNewName(ship.name);
    setShipNew(ship);
  }*/

  /*const removeShip = () => {
    // check if ship has commodities
    // fetch delete /api/ship/:shipId
    // then onFleetUpdate
  }*/

  /*const renameShip = () => {
    // fetch patch /api/ship/:shipId payload {name: shipNewName}
    // then onFleetUpdate
  }*/

  return (
    <div className="fleet-manager">
    <div className="fleet-selector">
      <fieldset>
        <legend>Add new Ship to your Shipping Fleet</legend>
        <div className="list--scrollable">
          <div className="scrollcontent">
            <div role="list" className="ship-list">
              {ships?.map((ship) => (
                <button
                  role="listitem"
                  key={ship.code}
                  onClick={() => selectShip(ship)}
                  className={classNames("ship ship--" + ship.manufacturer, {
                    active: selectedShip === ship,
                  })}
                >
                  <img alt={ship.name} src={"./ships/" + ship.code.toLowerCase() + ".jpg"}/>
                  <span>{ship.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </fieldset>
      <fieldset className="ship-namer">
        <legend>Name your Ship</legend>
        <div className="inner">
          <input
            aria-label="ship name"
            value={shipName}
            onChange={(event) => setShipName(event.target.value)}
          />
          <button className="button--primary" onClick={() => addShip()}>
            Add
          </button>
        </div>
      </fieldset>
      </div>
      
    </div>
  );
}

/*
<div className="ship-manager">
        <fieldset className="own-ships">
          <legend>Your current ships</legend>
           <div className="list--scrollable">
          <div className="scrollcontent">
            <div role="list" className="ship-list"></div><ShipSelector onChange={shipChanged}>

              </ShipSelector>
            </div>
            </div>
        </fieldset>
        <fieldset>
          <legend>Manage your ship</legend>
          <div className="inner">
          <input value={shipNewName} onChange={({value}) => setShipNewName(value)} />
          <button className="button--primary" onClick={renameShip}>Rename</button>
            <button className="button--harmful" onClick={removeShip}>Remove</button>
            </div>
        </fieldset>
        
      </div>
*/
export default FleetManager;
