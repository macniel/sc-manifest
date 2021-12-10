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
  const [cargo, setCargo] = useState([
    {
      code: "DIAM",
      amount: 420,
      total: 500,
      kind: "Metals",
      name: "Diamonds",
    },
    {
      code: "BERY",
      amount: 100,
      total: 300,
      name: "Beryl",
      kind: "Gems",
    },
  ]);
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
      fetch("/manifest/" + ship.associatedManifest)
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
    fetch("/sell/", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      method: "post",
    })
      .then((response) => response.json())
      .then((manifest) => {
        setCargo(manifest.commodities);
        setManifest(manifest);
      });
  };

  const accumulateCargo = (previous, current) => {
    console.log("Acc", current.amount);
    return previous.amount + current.amount;
  };

  return (
    <div className="spatial-layout">
      <fieldset className="commodity-fieldset">
        <legend>cargo</legend>
        {cargo.map((c, index) => (
          <CargoChart
            isActive={index === selectedCargo}
            cargo={c}
            onClick={() => {
              setSelectedCargo(index);
              setQuantity(cargo[index].amount);
            }}
          />
        ))}
      </fieldset>

      <fieldset className="shipEntry">
        <legend>From ship</legend>
        <ShipSelector onChange={setShip} />
      </fieldset>

      <fieldset className="shop">
        <legend>Target</legend>
      </fieldset>

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
      <div className="cmdline">
        {
          <>
            <span className="profit">{manifest?.profit ?? "-"} aUEC</span>
            <span className="cargofill">
              {Math.ceil(cargo.reduce((p, c) => p + c.amount, 0) / 100)} /{" "}
              {ship.scu} SCU
            </span>
          </>
        }
        <button onClick={sell}>Execute</button>
      </div>
    </div>
  );
}

export default ManifestView;
