import { useEffect, useState } from "react";
import NumberInput from "./NumberInput";
import ShipSelector from "./ShipSelector";
import ShopSelector from "./ShopSelector";
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

function CommodityEntry({ onCargoChange }) {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [ship, setShip] = useState({});
  const [isValid, setValid] = useState(true);
  const [refreshToken, setRefreshToken] = useState(Date.now());
  
  const [commodity, setCommodity] = useState({
    code: "",
    name: "",
  });
  const [commodities, setCommodities] = useState([]);
  const [source, setSource] = useState({
    code: "",
    name: "",
  });

  const setShop = (shop) => {
    if (shop != null) {
      setSource({ code: shop.code, name: shop.name });
      // update commodity display to show only buyables
      fetch("/api/commodities/?from=" + shop.code + "&mode=buy")
        .then((response) => response.json())
        .then((data) => {
          setCommodities(data);
        });
    } else {
      fetch("/api/commodities")
      .then((response) => response.json())
      .then((data) => {
        setCommodities(data);
      });
      setSource({}) 
    }
  }

  useEffect(() => {
    if (ship.ship && quantity && commodity) {
      const payload = {
        to: ship.ship,
        quantity: quantity,
        commodity: commodity.code,
      }
      fetch("/api/simulate-buy", {
        headers: { "Content-Type": "application/json" },
        method: "post",
        body: JSON.stringify(payload)
      }).then(res => res.json())
        .then(result => {
          setValid(result.status === "success");
        });
    }
  }, [quantity, ship, commodity]);

  const updateCommodity = (commodityItem) => {
    setCommodity(commodityItem);
    if (commodityItem.price_buy) {
      setPrice(commodityItem.price_buy);
    }
  }

  const buy = () => {
    const payload = {
      commodity: commodity.code,
      from: source.code,
      to: ship.ship,
      quantity: quantity,
      price: price,
    };
    setRefreshToken();

    fetch("/api/buy", {
      headers: { "Content-Type": "application/json" },
      method: "post",
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        const el = document.querySelector(`[data-ship-id="${ship.ship}"]`);
        const filled = data.filled;
        el.style.setProperty("--width", 100 - (filled / ship.scu) * 100 + "%");
        el.style.setProperty("--filled", (filled / ship.scu) * 100 + "%");
        if (filled / ship.scu === 1) {
          setShip({});
          el.disabled = true;
        }
        onCargoChange?.();
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

  return (
    <div className="spatial-layout">
      <div className="rows">
        <fieldset className="main">
          <legend>Add Commodity</legend>
          <div className="commodity-matrix">
            {commodities
              ?.filter(
                (commodity) =>
                  commodity.name.indexOf("Ore") === -1 &&
                  commodity.name.indexOf("Raw") === -1
              )
              .map((commodityItem) => (
                <button
                  onClick={() => updateCommodity(commodityItem)}
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
                <span>Selected Outpost: {source.name}</span>
              </div>
              <button
                onClick={buy}
                disabled={!ship.name || !quantity || !(price >= 0) || !isValid}
                className="button--primary"
              >
                Buy
              </button>
            </div>
          </fieldset>

          <fieldset className="shipEntry">
            <legend>Ship</legend>
            <ShipSelector onChange={setShip} refreshToken={refreshToken} />
          </fieldset>

          <fieldset className="shopEntry">
            <legend>Tradepost</legend>
            <ShopSelector onChange={setShop} refreshToken={refreshToken} defaultShop="GAFAF"></ShopSelector>
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
                value={price}
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
