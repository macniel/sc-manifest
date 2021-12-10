import React, { useState } from "react";

function ShopSelector({ onChange }) {
  const [path, setPath] = useState(["ST"]);

  return (
    <div>
      {path.map((pathSegment) => (
        <button>{pathSegment}</button>
      ))}

      <span className="shop-selector__title">Stanton</span>
    </div>
  );
}

export default ShopSelector;
