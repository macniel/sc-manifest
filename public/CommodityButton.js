class CommodityButton extends HTMLButtonElement {
  static get observedAttributes() {
    return ["highlight", "active"];
  }

  constructor() {
    super();
  }

  set highlight(newValue) {
    this.isHiglighted = newValue;
    this.render();
  }

  set active(newValue) {
    this.isActive = newValue;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "highlight") {
      this.isHiglighted = newValue;
    }
    if (name === "active") {
      this.isActive = newValue;
    }
    this.render();
  }

  set commodity(newValue) {
    this._commodity = newValue;
    this.render();
  }

  render() {
    if (this._commodity) {
      this.className = `commodity commodity--${this._commodity.kind.toLowerCase()}${
        this.isActive ? " active" : ""
      }`;
      this.title = this._commodity.name;
      const spanSymbol = document.createElement("span");
      spanSymbol.className = "commodity__label";
      spanSymbol.textContent = this._commodity.code;
      this.appendChild(spanSymbol);
    }
  }
}

customElements.define("commodity-button", CommodityButton, {
  extends: "button",
});
export default CommodityButton;
