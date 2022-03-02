import classNames from "classnames";
import React, { useEffect, useState } from "react";
import "./ShipSelector.css";

function ShipButton({
  ship,
  onClick,
  isActive,
  isBuyTarget = false,
  isInverse,
  demands = {},
}) {
  const [actualShip, setActualShip] = useState({});
  const [filledInPercent, setFilledInPercent] = useState(0);
  const [fulfilledDemands, setFulfilledDemands] = useState(false);
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

  useEffect(() => {
    if (demands && Object.keys(demands).length > 0) {
       // adjust free space in cargo hold
      const adjustedShip = { ...actualShip };
      adjustedShip.scu -= adjustedShip.filled
      const fulfilled = Object.keys(demands).filter(key => {
        const validator = demands[key];
        switch (validator.op) {
          case 'gt':
            return adjustedShip[key] > validator.target;
          case 'ge': 
            return adjustedShip[key] >= validator.target;
          case 'eq':
            // eslint-disable-next-line eqeqeq
            return adjustedShip[key] == validator.target;
          case 'lt':
            return adjustedShip[key] < validator.target;
          case 'le':
            return adjustedShip[key] <= validator.target;
          
          case 'ne':
            // eslint-disable-next-line eqeqeq
            return adjustedShip[key] != validator.target;
          default:
            return true;
        }
      });
      return setFulfilledDemands(fulfilled.length !== 0);
    }
    setFulfilledDemands(true);
  }, [demands, actualShip]);

  return (
    <button
      disabled={ (isBuyTarget && filledInPercent === 1) || !fulfilledDemands}
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

function ShipSelector({ demands = {}, onChange, isInverse = false }) {
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
      <div className="scrollcontent">
        {ownShips.map((shipId) => (
          <ShipButton
            demands={demands}
            key={shipId}
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
