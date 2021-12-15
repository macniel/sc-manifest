import { useState, useEffect } from "react";
import NumberInput from "./NumberInput";
import classNames from "classnames";
import ShipSelector from "./ShipSelector";
import "./ManifestView.css";

function CargoChart({ cargo, onClick, isActive }) {
  return (
    <div
      className={classNames("cargo-chart", {
        active: isActive,
      })}
      onClick={() => {
        console.log(cargo);
        onClick?.(cargo);
      }}
    >
      <span>{cargo.name}</span>
      <div className="meter">
        <div
          className="fill"
          style={{ width: (cargo.amount / cargo.total) * 100 + "%" }}
        >
          {cargo.amount} cSCU
        </div>
      </div>
    </div>
  );
}

function ManifestView() {
  const [cargo, setCargo] = useState([]);
  const [selectedCargo, setSelectedCargo] = useState(cargo[0]);
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    console.log("changed Selected Cargo to", cargo[selectedCargo]);
    if (cargo[selectedCargo]) {
      console.log(cargo[selectedCargo].amount);
    }
    setPrice(0);
  }, [selectedCargo, cargo]);

  const [ship, setShip] = useState({});

  useEffect(() => {
    if (ship.associatedManifest) {
      fetch("/api/manifest/" + ship.associatedManifest)
        .then((response) => response.json())
        .then((manifest) => {
          setManifest(manifest);
          setCargo(manifest.commodities);
        });
    } else {
      setCargo([]);
    }

    // get manifest of associated ship
  }, [ship]);

  const [manifest, setManifest] = useState(null);
  const [sellPrice, setSellPrice] = useState(0);
  const [sellQuantity, setSellQuantity] = useState(0);

  const sell = function () {
    const payload = {
      manifest: manifest.manifest,
      price: sellPrice,
      quantity: sellQuantity,
      commodity: cargo[selectedCargo].code,
    };
    fetch("/api/sell/", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      method: "post",
    })
      .then((response) => response.json())
      .then(({ manifest, filled }) => {
        setCargo(manifest.commodities);
        setManifest(manifest);
        const el = document.querySelector(`[data-ship-id="${ship.ship}"]`);

        if (filled === 0) {
          setSelectedCargo({});
        }
      });
  };

  const archive = function () {
    fetch("/api/archive", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manifest: manifest.manifest,
      }),
      method: "post",
    })
      .then((response) => response.json())
      .then((manifest) => {
        if (!localStorage.getItem("logs")) {
          localStorage.setItem("logs", "[]");
        }
        const logs = JSON.parse(localStorage.getItem("logs") || []);
        logs.push(manifest.manifest);
        localStorage.setItem("logs", JSON.stringify(logs));
        setCargo([]);
      });
  };

  return (
    <div className="spatial-layout">
      <div className="rows">
        <fieldset className="main">
          <legend>cargo</legend>
          {cargo.map((c, index) => (
            <CargoChart
              isActive={index === selectedCargo}
              cargo={c}
              onClick={() => {
                setSelectedCargo(index);
                setQuantity(cargo[index].amount);
                setPrice("0");
              }}
            />
          ))}
        </fieldset>
        <div className="sidebar">
          <fieldset className="shipEntry">
            <legend>From ship</legend>
            <ShipSelector onChange={setShip} />
          </fieldset>

          <fieldset className="shop">
            <legend>Actions</legend>
            <div className="inner-layout">
              <div className="info">
                {
                  <>
                    <span className="name">
                      {ship?.shipsName || ship?.name}
                    </span>

                    <span
                      className={classNames("profit", {
                        negative: manifest?.profit < 0,
                        positive: manifest?.profit >= 0,
                      })}
                    >
                      {manifest?.profit ?? "-"} aUEC
                    </span>
                    <span className="cargofill">
                      {Math.ceil(cargo.reduce((p, c) => p + c.amount, 0) / 100)}{" "}
                      / {ship.scu} SCU
                    </span>
                  </>
                }
              </div>
              <button
                className="button--primary"
                disabled={manifest == null}
                onClick={archive}
              >
                Archive
              </button>
              <button
                className="button--primary"
                disabled={selectedCargo == null || sellQuantity <= 0}
                onClick={sell}
              >
                Execute
              </button>
            </div>
          </fieldset>

          <div className="lower-row">
            <fieldset className="quantity">
              <legend>Quantity</legend>
              <NumberInput
                max={quantity}
                value={quantity}
                min={0}
                onChange={setSellQuantity}
              />
            </fieldset>

            <fieldset className="price">
              <legend>Price</legend>
              <NumberInput value={price} onChange={setSellPrice} />
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManifestView;
