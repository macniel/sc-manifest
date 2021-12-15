import classNames from "classnames";
import React, { useEffect, useState, useRef, forwardRef } from "react";
import "./ShipSelector.css";

function ShipButton({
  ship,
  onClick,
  isActive,
  isBuyTarget = false,
  isInverse,
}) {
  const [actualShip, setActualShip] = useState({});
  const [filledInPercent, setFilledInPercent] = useState(0);
  useEffect(() => {
    if (ship) {
      fetch(`/api/ship/${ship}`)
        .then((response) => response.json())
        .then((data) => {
          setActualShip(data);
          setFilledInPercent(data.filled / data.scu);
        });
    }
  }, [ship]);

  return (
    <button
      disabled={isBuyTarget && filledInPercent === 1}
      data-ship-id={actualShip.ship}
      onClick={() => {
        onClick?.(actualShip);
      }}
      className={classNames("ship-list ship-list__button", {
        active: isActive,
        inverse: isInverse,
      })}
      style={{
        backgroundImage:
          "url('/ships/" + actualShip?.code?.toLowerCase() + ".jpg')",
        "--width": 100 + filledInPercent * -100 + "%",
        "--filled": filledInPercent * 100 + "%",
      }}
    >
      <span className="button__label">
        {actualShip.shipsName || actualShip.name}
      </span>
    </button>
  );
}

function ShipSelector({ onChange, isInverse = false }) {
  const [ownShips, setOwnShips] = useState([]);

  const [ship, setShip] = useState({});

  const ships = useRef(new Array());

  // register storage changes
  useEffect(() => {}, []);

  // load ships from storage
  useEffect(() => {
    if (localStorage.getItem("ships")) {
      setOwnShips(JSON.parse(localStorage.getItem("ships")));
    }
  }, []);

  /*
   */

  return (
    <div className="list--scrollable">
      <div className="scrollcontent">
        {ownShips.map((shipId) => (
          <ShipButton
            isInverse={isInverse}
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
    </div>
  );
}

export default ShipSelector;
