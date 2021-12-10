import classNames from "classnames";
import React, { useEffect, useState } from "react";
import "./ShipSelector.css";

function ShipButton({ ship, onClick, isActive }) {
  const [actualShip, setActualShip] = useState({
    shipsName: "golddigger",
    code: "FREMAX",
    name: "Freelancer MAX",
    manufacturer: "MISC",
    scu: 12000,
    associatedManifest: "0",
  });

  useEffect(() => {
    if (ship) {
      fetch(`/ship/${ship}`)
        .then((response) => response.json())
        .then((data) => setActualShip(data));
    }
  }, [ship]);

  return (
    <button
      onClick={() => {
        onClick?.(actualShip);
      }}
      className={classNames("ship-list ship-list__button", {
        active: isActive,
      })}
      style={{
        backgroundImage:
          "url('./ships/" + actualShip?.code?.toLowerCase() + ".jpg')",
      }}
    >
      <span className="button__label">
        {actualShip.shipsName || actualShip.name}
      </span>
    </button>
  );
}

function ShipSelector({ onChange }) {
  const [ownShips, setOwnShips] = useState([]);

  const [ship, setShip] = useState({});

  // register storage changes
  useEffect(() => {}, []);

  // load ships from storage
  useEffect(() => {
    if (localStorage.getItem("ships")) {
      setOwnShips(JSON.parse(localStorage.getItem("ships")));
    }
  }, []);

  return (
    <div className="list--scrollable">
      {ownShips.map((shipId) => (
        <ShipButton
          isActive={shipId === ship.ship}
          ship={shipId}
          onClick={(newShip) => {
            console.log(newShip);
            setShip(newShip);
            onChange?.(newShip);
          }}
        ></ShipButton>
      ))}
    </div>
  );
}

export default ShipSelector;
