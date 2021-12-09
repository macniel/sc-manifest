import { useEffect, useState } from "react";
import "./FleetManager.css";

function FleetManager() {
  const [ships, setShips] = useState([]);

  const addShip = (ship) => {
    console.log(ship);
  };

  useEffect(() => {
    fetch("/ships")
      .then((response) => response.json())
      .then(setShips);
  }, []);
  return (
    <fieldset>
      <legend>Add new Ship to your Shipping Fleet</legend>
      <ul className="ship-list">
        {ships?.map((ship) => (
          <li
            key={ship.code}
            onClick={() => addShip(ship)}
            className={"ship ship--" + ship.manufacturer}
            style={{
              backgroundImage:
                "url('./ships/" + ship.code.toLowerCase() + ".jpg')",
            }}
          >
            <span>{ship.name}</span>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

export default FleetManager;
