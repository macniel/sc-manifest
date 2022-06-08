import { useEffect, useState } from "react";
import NumberInput from "./NumberInput";
import ShipSelector from "./ShipSelector";
import ShopSelector from "./ShopSelector";
import "./CommodityEntry.css";
import CommodityInput from "./CommodityInput";

function CommodityEntry({ onCargoChange }) {
  const [quantity, setQuantity] = useState('0');
  const [price, setPrice] = useState('0');
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
    } else {
      setPrice('')
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


  return (
    <div className="spatial-layout">
      <div className="rows">
        <fieldset className="main">
          <legend>Add Commodity</legend>
          <div className="commodity-matrix">
            <CommodityInput commodities={commodities} onChange={(c) => { updateCommodity(c) }}></CommodityInput>
          </div>
        </fieldset>

        <div className="sidebar">

          <fieldset className="shipEntry">
            <legend>Ship</legend>
            <ShipSelector onChange={setShip} refreshToken={refreshToken} />
          </fieldset>

          <fieldset className="shopEntry">
            <legend>Tradepost</legend>
            <ShopSelector onChange={setShop} refreshToken={refreshToken}></ShopSelector>
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
                    <fieldset>
            <legend>Actions</legend>
            <div className="inner-layout">
              <div className="info">
                <span>
                  Ship: {ship.shipsName} ({ship.name})
                </span>
                <span>Price: {(quantity || 0) * (price || 0)} aUEC</span>
                <span>Outpost: {source.name}</span>
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
        </div>
      </div>
    </div>
  );
}

export default CommodityEntry;
