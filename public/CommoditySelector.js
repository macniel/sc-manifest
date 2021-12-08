import CommodityButton from "./CommodityButton.js";

/**
 * @typedef {Object}   Commodity
 * @property {string}  code
 * @property {string}  name
 * @property {('Agricultural' | 'Metal' | 'Drug' | 'Natural' | 'Mineral' | 'Halogen' | 'Temporary' | 'Vice' | 'Gas' | 'Medical' | 'Scrap' | 'Waste')} kind
 * @property {number}  trade_price_buy;
 * @property {number}  trade_price_sell;
 */

class CommoditySelector extends HTMLElement {
  set callback(newValue) {
    this._callback = newValue;
    this.render();
  }

  get callback() {
    return this._callback;
  }

  constructor() {
    super();
    // fetch commodities from backend
    /** @type {Commodity[]} */
    this._commodities = window.commodities;
    this.render();
  }

  get selectedCommodity() {
    return this._selectedCommodity;
  }

  set selectedCommodity(newValue) {
    this._selectedCommodity = newValue;

    this.render();
  }

  render() {
    this.innerHTML = "";
    this._commodities.forEach((commodity, index) => {
      /** @type {CommodityButton} */
      const commodityButton = document.createElement("button", {
        is: "commodity-button",
      });
      commodityButton.addEventListener("click", ({ target }) => {
        this.querySelectorAll("button").forEach(
          (button) => (button.active = false)
        );
        target.active = true;
        if (this.callback && typeof this.callback == "function") {
          this.callback(commodity);
        }
      });
      commodityButton.commodity = commodity;
      if (commodity == this.selectedCommodity) {
        commodityButton.active = true;
      }
      this.appendChild(commodityButton);
    });
  }
}

customElements.define("commodity-selector", CommoditySelector);
export default CommoditySelector;
