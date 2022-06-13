import { useState, useEffect } from "react";
import NumberInput from "./NumberInput";
import classNames from "classnames";
import ShipSelector from "./ShipSelector";
import "./ManifestView.css";
import ShopSelector from "./ShopSelector";

function CargoChart({ cargo, onClick, isActive, isSellable }) {

  console.log(Math.ceil(cargo.amount / 100) + " SCU Crates");
  
  let crates = [];
  let cratesTotal = Math.ceil(cargo.amount / 100);
  for (let i = 0; i < cratesTotal; ++i) {
    crates.push({
      amount: cargo.total - i*100 > 100 ? 100: cargo.total - i*100,
      total: 100,
    })
  }
  return (
    <div
      className={classNames("cargo-chart", {
        active: isActive,
        
      })}
      onClick={() => {
          onClick?.(cargo);
      }}
    >
      <span>{cargo.name}</span>
      {!isSellable && <span className="danger" title="Cargo is not sellable at this port"/>}
      <div className="meter">
        <div style={{ width: "100%" }}>
        {crates.map(crate => 
        <div className="crate"><div
          className="fill"
          style={{ width: (crate.amount / crate.total) * 100 + "%" }}
          >  
            </div>
            </div>
        )}
        </div>
          {cargo.amount} cSCU
        </div>
    </div>
  );
}

function ManifestView() {
  const [cargo, setCargo] = useState([]);
  const [selectedCargo, setSelectedCargo] = useState(cargo[0]);
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [estimatedProfit, setEstimatedProfit] = useState(0);

  const updateSelectedCargo = (selectedCargoIndex) => {
    if (selectedCargo === selectedCargoIndex) {
      setSelectedCargo(-1)
      setQuantity(0)
      setPrice(0)
    } else {
      setSelectedCargo(selectedCargoIndex);
      setQuantity(cargo[selectedCargoIndex].amount);
      setPrice(sellDestination?.prices?.[cargo[selectedCargoIndex].code]?.price_sell || 0);
    }
  }

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
  const [sellDestination, setSellDestination] = useState('');
  const [sellableCommodities, setSellableCommodities] = useState([]);
  
  useEffect(() => {
    const fetchCommodityPrices = async () => {
      const prices = await fetch("/api/commodities")
        .then((response) => response.json());
      if (manifest && manifest.commodities) {
        const total = manifest.commodities.reduce((p, c) => {
          const price = prices.find(price => price.code === c.code)?.trade_price_sell ?? 0;
          const amount = c.total || 0;
          return p += price * amount
        }, 0);
        setEstimatedProfit(total.toFixed(0));
      }
    }
    fetchCommodityPrices();
    
  }, [manifest])

  const sell = function () {
    const payload = {
      manifest: manifest.manifest,
      price: sellPrice,
      quantity: sellQuantity,
      shop: sellDestination.code,
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
        el.style.setProperty("--filled", 100 - (filled / ship.scu) * 100 + "%");
        el.style.setProperty("--width", (filled / ship.scu) * 100 + "%");
        if (filled === 0) {
          setSelectedCargo(null);
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
        setCargo([]);
        setSelectedCargo(null);
        setShip({});
      });
  };

  const setDestination = (shop) => {
    
    const commodities = Object.entries(shop.prices).filter(([key, price]) => price.operation === "sell").map( ([key, price]) => {
    return {
      code: key
    }
    })
    setSellableCommodities(commodities);
    
    setSellDestination(shop)
    if (selectedCargo) {
      setPrice(shop.prices[cargo[selectedCargo].code].price_sell)
    }
  }

  return (
    <div className="spatial-layout">
      <div className="rows">
        <fieldset className="main">
          <legend>cargo</legend>
          <div className="list--scrollable">
            <div className="scrollcontent">
          {cargo.map((c, index) => (
            <CargoChart
              isActive={index === selectedCargo}
              isSellable={sellableCommodities.find(sc => sc.code === c.code)}
              cargo={c}
              key={c.name}
              onClick={() => {
                updateSelectedCargo(index);
              }}
            />
          ))}
              </div>
            </div>
        </fieldset>
        
        <div className="sidebar">
          <fieldset className="shipEntry">
            <legend>From ship</legend>
            <ShipSelector selected={ship} onChange={setShip} isInverse={true} />
          </fieldset>

          <fieldset>
            <legend>Target Tradepost</legend>
            <ShopSelector onChange={setDestination} />
          </fieldset>

          <div className="lower-row">
            <fieldset className="quantity">
              <legend>Quantity</legend>
              <NumberInput
                max={quantity}
                value={sellQuantity}
                min={0}
                onChange={setSellQuantity}
              />
            </fieldset>

            <fieldset className="price">
              <legend>Price</legend>
              <NumberInput value={price} onChange={setSellPrice} />
            </fieldset>

            
          </div>
          <fieldset className="shop">
            <legend>Actions</legend>
            <div className="inner-layout">
              <div className="info">
                {
                  <>
                    <span className="name">
                      Ship: {ship?.shipsName || ship?.name}
                    </span>
                    <span>Outpost: {sellDestination.name}
                  </span>
                    <span
                      className={classNames("profit", {
                        negative: manifest?.profit < 0,
                        positive: manifest?.profit >= 0,
                      })}
                    >
                      Profit: {manifest?.profit?.toFixed(0) ?? "-"} aUEC
                      (est. {estimatedProfit} aUEC)
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
                Sell
              </button>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

export default ManifestView;
