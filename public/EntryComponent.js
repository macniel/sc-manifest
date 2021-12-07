import NumberInput from "./NumberInput.js";
import CommoditySelector from "./CommoditySelector.js";
import Webservices from "./webservices.js";

class EntryComponent extends HTMLElement {
  constructor() {
    super();
    this.reset();
    Webservices.instance.addEventListener("manifest", (data) => {
      console.log("updated Manifest to", data);
    });
    this.render();
  }

  set quantity(newValue) {
    this._quantity = newValue;
    this.render();
  }

  get quantity() {
    return this._quantity;
  }

  set price(newValue) {
    this._price = newValue;
    this.render();
  }

  get price() {
    return this._price;
  }

  set commodity(newValue) {
    this._commodity = newValue;
    this.render();
  }

  get commodity() {
    return this._commodity;
  }

  set sourceStation(newValue) {
    window.sourceStation = newValue;
    this.render();
  }

  get sourceStation() {
    return window.sourceStation;
  }

  get command() {
    return `${this.commodity?.code ?? ""} ${this.sourceStation ?? ""} ${
      this.quantity || 0
    }@${(this.price || 0).toFixed(2)}`;
  }

  connectedCallback() {
    this.render(true);
  }

  reset() {
    this.commodity = null;
    this.price = 0;
    this.quantity = 0;
    this.sourceStation = ["ST"];
  }

  render(fullRefresh = false) {
    this.innerHTML = "";
    const header = document.createElement("header");
    const spatialLayout = document.createElement("div");
    spatialLayout.className = "four-section";

    const commoditySelectorFieldset = document.createElement("fieldset");
    const csFLegend = document.createElement("legend");
    csFLegend.textContent = "Commodity";

    const commoditySelector = new CommoditySelector();
    commoditySelector.selectedCommodity = this.commodity;
    commoditySelector.callback = (commodity) => {
      console.log(commodity);
      this.commodity = commodity;
    };

    commoditySelectorFieldset.appendChild(csFLegend);
    commoditySelectorFieldset.appendChild(commoditySelector);

    const sourceSelectorFieldset = document.createElement("fieldset");
    sourceSelectorFieldset.innerHTML = `
        <legend>Source Station (Optional)</legend>
    <div class="source-selector--outer">
    <div id='sourceSelectorBox'>
        <button class="source-selector source--system" onclick="showShopSelector(0)"><span class="source__label">ST</span></button>
    </div>
    <span id='sourceStationName'></span>
    </div>
        `;

    const quantityFieldset = document.createElement("fieldset");
    const quantityFieldsetLegend = document.createElement("legend");
    quantityFieldsetLegend.textContent = "Quantity";
    const quantityInputNumber = new NumberInput();
    quantityInputNumber.size = 7;
    quantityInputNumber.label = "cSCU";
    quantityInputNumber.min = 0;
    quantityInputNumber.value = this.quantity;
    quantityInputNumber.onChange = (newQuantity) => {
      this.quantity = newQuantity;
    };
    quantityFieldset.append(quantityFieldsetLegend);
    quantityFieldset.append(quantityInputNumber);

    const priceFieldset = document.createElement("fieldset");
    const priceFieldsetLegend = document.createElement("legend");
    priceFieldsetLegend.textContent = "Quantity";
    const priceInputNumber = new NumberInput();
    priceInputNumber.size = 6;
    priceInputNumber.label = "aUEC";
    priceInputNumber.min = 0;
    priceInputNumber.value = this.price;
    priceInputNumber.fraction = 2;
    priceInputNumber.onChange = (newPrice) => {
      this.price = newPrice;
    };
    priceFieldset.append(priceFieldsetLegend);
    priceFieldset.append(priceInputNumber);

    const footer = document.createElement("footer");
    footer.className = "manifest-actions";
    const cmdLine = document.createElement("pre");
    cmdLine.textContent = this.command;
    cmdLine.className = "command";
    const buttonBox = document.createElement("div");
    buttonBox.className = "button-box";

    const addToManifest = document.createElement("button");
    addToManifest.addEventListener("click", () => {
      Webservices.instance.wsAddToManifest("", {
        commodity: this.commodity,
        shop: this.sourceStation,
        quantity: this.quantity,
        price: this.price,
      });
      window.sourceStation = "";
      this.price = 0;
      this.quantity = 0;
      this.commodity = null;
      this.render();
    });
    buttonBox.appendChild(addToManifest);

    footer.appendChild(cmdLine);
    footer.appendChild(buttonBox);

    spatialLayout.appendChild(commoditySelectorFieldset);
    spatialLayout.appendChild(sourceSelectorFieldset);
    spatialLayout.appendChild(quantityFieldset);
    spatialLayout.appendChild(priceFieldset);

    this.appendChild(header);
    this.appendChild(spatialLayout);
    this.append(footer);
  }
}

customElements.define("entry-component", EntryComponent);
