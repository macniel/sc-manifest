import React, { useState } from "react";
import classNames from 'classnames';
import "./NumberInput.css";
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

function CommodityInput({ onChange, commodities }) {
    const [commodity, setCommodity] = useState({});


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

    const updateCommodity = (commodity) => {
        setCommodity(commodity);
        onChange?.(commodity);
    }

    return <div>{commodities
        ?.filter(
            (commodity) =>
                commodity.name.indexOf("Ore") === -1 &&
                commodity.name.indexOf("Raw") === -1
        )
        .map((commodityItem) => (
            <button
                key={commodityItem.code}
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
    </div>;
}

export default CommodityInput;