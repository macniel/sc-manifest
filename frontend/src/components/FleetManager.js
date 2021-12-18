import classNames from "classnames";
import { useEffect, useState } from "react";
import "./FleetManager.css";

function FleetManager({ onFleetUpdate }) {
  const [ships, setShips] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [shipName, setShipName] = useState("");

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
    fetch("/api/ships")
      .then((response) => response.json())
      .then(setShips);
  }, []);
  return (
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
                  style={{
                    backgroundImage:
                      "url('./ships/" + ship.code.toLowerCase() + ".jpg')",
                  }}
                >
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
  );
}

export default FleetManager;
