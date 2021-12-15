import { useEffect, useState } from "react";
import NumberInput from "./NumberInput";
import ShipSelector from "./ShipSelector";
import "./CommodityEntry.css";
import classNames from "classnames";

import { ReactComponent as OreIcon } from "../assets/metal.svg";
import { ReactComponent as GasIcon } from "../assets/foam.svg";
import { ReactComponent as GemsIcon } from "../assets/gems.svg";
import { ReactComponent as DrugsIcon } from "../assets/medicines.svg";
import { ReactComponent as MedicalIcon } from "../assets/hospital-cross.svg";
import { ReactComponent as FoodIcon } from "../assets/knife-fork.svg";
import { ReactComponent as AgriculturalIcon } from "../assets/wheat.svg";
import { ReactComponent as NaturalIcon } from "../assets/three-leaves.svg";
import { ReactComponent as WasteIcon } from "../assets/waste.svg";
import { ReactComponent as RecycleIcon } from "../assets/recycle.svg";

function CommodityEntry() {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [ship, setShip] = useState({});
  const [commodity, setCommodity] = useState({
    code: "HADA",
    name: "Hadanite",
  });
  const [commodities, setCommodities] = useState([]);
  const [source, setSource] = useState({
    code: "ANDER",
    name: "HDMS-Anderson",
  });

  useEffect(() => {
    fetch("/api/commodities")
      .then((response) => response.json())
      .then((data) => {
        setCommodities(data);
      });
  }, []);

  const buy = () => {
    const payload = {
      commodity: commodity.code,
      from: source.code,
      to: ship.ship,
      quantity: quantity,
      price: price,
    };

    fetch("/api/buy", {
      headers: { "Content-Type": "application/json" },
      method: "post",
      body: JSON.stringify(payload),
    });
  };

  const renderSvg = (kind) => {
    switch (kind) {
      case "metal":
        return <OreIcon />;
      case "gas":
      case "halogen":
        return <GasIcon />;
      case "mineral":
        return <GemsIcon />;
      case "drug":
      case "vice":
        return <DrugsIcon />;
      case "medical":
        return <MedicalIcon />;
      case "food":
        return <FoodIcon />;
      case "agricultural":
        return <AgriculturalIcon />;
      case "natural":
        return <NaturalIcon />;
      case "waste":
        return <WasteIcon />;
      case "junk":
      case "scrap":
      case "temporary":
      default:
        return <RecycleIcon />;
    }
  };

  const destroyShip = () => {};

  return (
    <div className="spatial-layout">
      <div className="rows">
        <fieldset className="main">
          <legend>Add Commodity</legend>
          <div className="commodity-matrix">
            {commodities?.map((commodityItem) => (
              <button
                onClick={() => setCommodity(commodityItem)}
                className={classNames("commodity", {
                  active: commodity.code === commodityItem.code,
                })}
                title={commodityItem.name}
              >
                {renderSvg(commodityItem.kind.toLowerCase())}
                <span className="commodity__label">{commodityItem.code}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="sidebar">
          <fieldset>
            <legend>Actions</legend>
            <div className="inner">
              <div className="status">
                <span>
                  Selected Ship: {ship.shipsName} ({ship.name})
                </span>
                <span>Selected Commodity: {commodity.name}</span>
                <span>Price: {(quantity || 0) * (price || 0)} aUEC</span>
              </div>
              <button onClick={buy} className="button--primary">
                Buy
              </button>
            </div>
          </fieldset>

          <fieldset className="shipEntry">
            <legend>Ship</legend>
            <ShipSelector onChange={setShip} />
          </fieldset>

          <div className="lower-row">
            <fieldset className="quantity">
              <legend>Quantity</legend>
              <NumberInput
                value=""
                onChange={(newValue) => {
                  setQuantity(parseInt(newValue));
                }}
              />
            </fieldset>

            <fieldset className="price">
              <legend>Price</legend>
              <NumberInput
                value=""
                onChange={(newValue) => {
                  setPrice(parseFloat(newValue));
                }}
              />
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommodityEntry;
