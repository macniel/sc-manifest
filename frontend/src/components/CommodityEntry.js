import { useEffect, useState } from "react";
import NumberInput from "./NumberInput";
import ShipSelector from "./ShipSelector";
import "./CommodityEntry.css";
import classNames from "classnames";
import ShopSelector from "./ShopSeelctor";

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
    fetch("/commodities")
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

    fetch("/buy", {
      headers: { "Content-Type": "application/json" },
      method: "post",
      body: JSON.stringify(payload),
    });
  };

  return (
    <div className="spatial-layout">
      <div className="rows">
        <fieldset className="main">
          <legend>Add Commodity</legend>
          <div className="commodity-matrix">
            {commodities?.map((commodityItem) => (
              <button
                onClick={() => setCommodity(commodityItem)}
                className={classNames(
                  "commodity",
                  "commodity--" + commodityItem.kind.toLowerCase(),
                  {
                    active: commodity.code === commodityItem.code,
                  }
                )}
                title={commodityItem.name}
              >
                <span className="commodity__label">{commodityItem.code}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="sidebar">
          <fieldset>
            <legend>Actions</legend>
            <button onClick={buy} className="button--primary">
              Buy
            </button>
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
