import classNames from "classnames";
import { useEffect, useState } from "react";
import "./FleetManager.css";
import ShipSelector from "./ShipSelector";

function FleetManager({ onFleetUpdate }) {
  const [ships, setShips] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [shipName, setShipName] = useState("");
  const [shipNewName, setShipNewName] = useState("");
  const [shipNew, setShipNew] = useState(null);
  const [token, setToken] = useState('');

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
        setToken(Date.now());
        setSelectedShip(null);
        setShipName("");
      });
  };

  const selectShip = (ship) => {
    setSelectedShip(ship);
    setShipName(ship.name);
    setShipNew({});
  };

  useEffect(() => {
    fetch("/api/all-ships")
      .then((response) => response.json())
      .then(setShips);
  }, []);

  const shipChanged = (ship) => {
    setShipNewName(ship.shipsName || ship.name);
    setShipNew(ship);
    setSelectedShip({});
  }
  const removeShip = () => {
    if (shipNew.ship) {
      
        fetch('/api/ship/' + shipNew.ship, {
          headers: { 'Content-Type': 'application/json' },
          method: 'DELETE'
        }).then(res => {
          setToken(Date.now());
          setShipNew({});
          setShipNewName('');
        })
      }
  }

  const renameShip = () => {
    if (shipNew.ship && shipNewName.trim() !== '') {
      fetch('/api/ship/' + shipNew.ship, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shipNewName
        }),
        method: 'PATCH'
      }).then(res => res.json()).then(res => {
        setToken(Date.now());
        setShipNew({});
        setShipNewName('');
      })
    }
  }

  return (
    <div className="spatial-layout">
    <div className="rows">
      <fieldset className="main">
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
        <div className="sidebar">
          <fieldset className="shipEntry">
          <legend>Your current ships</legend>
           
                <ShipSelector refreshToken={token} selected={shipNew} onChange={shipChanged}></ShipSelector>
           
          </fieldset>
          <fieldset>
          <legend>Actions</legend>
          <div className="inner">
            {shipNew?.name ? 
              <>
                <input value={shipNewName} onChange={({ target }) => setShipNewName(target.value)} />
              <button className="button--primary" onClick={renameShip}>Rename</button>
                <button disabled={shipNew.filled !== 0} title={shipNew.filled === 0 ? '' : 'Ship has remaining Cargo'} className="button--harmful" onClick={removeShip}>Remove</button>
              </>
              :
              <>
                  <input value={shipName} onChange={({ target }) => setShipName(target.value)} />
          <button className="button--primary" onClick={addShip}>Add Ship</button></>
          }
            </div>
        </fieldset>
      </div>
        
      </div>
      </div>
  );
}


export default FleetManager;
