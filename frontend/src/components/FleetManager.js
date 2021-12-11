import { useEffect, useState } from "react";
import "./FleetManager.css";

function FleetManager() {
  const [ships, setShips] = useState([]);

  const addShip = (ship) => {
    console.log(ship);
    fetch("/ship", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipName: "",
        code: ship.code,
      }),
    })
      .then((response) => response.json())
      .then((newShip) => {
        let shipList = localStorage.getItem("ships");

        if (!shipList) {
          shipList = "[]";
        }
        const l = JSON.parse(shipList);
        l.push(newShip.ship);
        localStorage.setItem("ships", JSON.stringify(l));
      });
  };

  useEffect(() => {
    fetch("/ships")
      .then((response) => response.json())
      .then(setShips);
  }, []);
  return (
    <fieldset>
      <legend>Add new Ship to your Shipping Fleet</legend>
      <div role="list" className="ship-list">
        {ships?.map((ship) => (
          <button
            role="listitem"
            key={ship.code}
            onClick={() => addShip(ship)}
            className={"ship ship--" + ship.manufacturer}
            style={{
              backgroundImage:
                "url('./ships/" + ship.code.toLowerCase() + ".jpg')",
            }}
          >
            <span>{ship.name}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default FleetManager;
