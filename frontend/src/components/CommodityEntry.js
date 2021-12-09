import { useEffect, useState } from "react";
import NumberInput from "./NumberInput";
import "./CommodityEntry.css";
import classNames from "classnames";

function CommodityEntry() {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
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

  return (
    <div className="spatial-layout">
      <fieldset className="commodity-fieldset">
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

      <fieldset className="shop">
        <legend>Source</legend>
      </fieldset>

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
      <div className="cmdline">
        <pre>
          {commodity.code} {source.code} {(quantity || 0).toFixed(0)}@
          {(price || 0).toFixed(2)}{" "}
        </pre>
      </div>
    </div>
  );
}

export default CommodityEntry;
