import Webservices from "./Webservices.js";

class FleetComponent extends HTMLElement {
  set ships(newValue) {
    this._ships = newValue;
    this.render();
  }

  get ships() {
    return this._ships;
  }

  constructor() {
    super();
    Webservices.instance.addEventListener("ships", (ships) => {
      this.ships = ships;
    });
    Webservices.instance.wsListShips();
  }

  render() {
    this.innerHTML = "";
    const header = document.createElement("header");
    /*
    const fieldsetManifest = document.createElement("fieldset");
    const fieldsetManifestLegend = document.createElement("legend");
    fieldsetManifestLegend.textContent = "Take Manifest with Id";

    const input = document.createElement("input");
    input.placeholder = "01234567-89ab-cdef-0123-456789abcdef";
    const confirm = document.createElement("button");
    confirm.addEventListener("click", () => {
      Webservices.instance.wsGetManifest(input.value);
    });
    confirm.textContent = "own";

    fieldsetManifest.appendChild(fieldsetManifestLegend);
    fieldsetManifest.appendChild(input);
    fieldsetManifest.appendChild(confirm);
*/
    const fieldset = document.createElement("fieldset");
    const fieldsetLegend = document.createElement("legend");
    fieldsetLegend.textContent = "Add new Ship to your Shipping Fleet";

    const list = document.createElement("ul");
    list.className = "shiplist";
    this.ships.forEach((shipDetail) => {
      const listItem = document.createElement("li");
      const name = document.createElement("span");

      name.textContent = shipDetail.name;

      listItem.className = "ship ship--" + shipDetail.manufacturer;
      listItem.addEventListener("click", () => {
        Webservices.instance.wsCreateManifest(shipDetail.code);
      });
      listItem.appendChild(name);
      list.appendChild(listItem);
    });
    this.appendChild(header);
    fieldset.appendChild(fieldsetLegend);
    fieldset.appendChild(list);
    //this.appendChild(fieldsetManifest);
    this.appendChild(fieldset);
  }
}

customElements.define("fleet-component", FleetComponent);
