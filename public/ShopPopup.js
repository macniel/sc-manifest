class ShopPopup extends HTMLElement {
  /*
    * 
window.sourcePath = ["ST"];
window.destPath = ["ST"];
window.popupMode = "shop";
window.showShopSelector = function (resetToSegment, isDestination) {
  const shim = document.getElementById("shim");
  const popup = document.getElementById("shopPopup");
  if (isDestination) {
    window.popupMode = "dest";
  } else {
    window.popupMode = "source";
  }
  console.log(isDestination, window.popupMode);
  shim.hidden = false;
  shim.forPopup = "shopPopup";
  popup.hidden = false;
  if (resetToSegment != undefined) {
    window.resetShopSelectorTo(resetToSegment);
  } else {
    window.updateShopSelector();
  }
};

window.resetShopSelectorTo = function (position) {
  if (position == 0) {
    window[window.popupMode + "Path"] = ["ST"];
  } else {
    window[window.popupMode + "Path"] = window[
      window.popupMode + "Path"
    ].splice(0, position);
  }
  window.updateShopSelector();
};

window.updateShopSelector = function () {
  const shopSelector = document.querySelector("#shopPopup");
  const breadcrumbs = shopSelector.querySelector("#currentPath");
  let page = { name: "universe", symbol: "UNIV", children: window.system };
  let crumbsHtml = "";
  let idx = 0;
  for (idx in window[window.popupMode + "Path"]) {
    const pathSegment = window[window.popupMode + "Path"][idx];
    if (page.children) {
      crumbsHtml += `<li onclick="resetShopSelectorTo('${idx})">${pathSegment}</li>`;
      page = page.children.find((child) => child.code == pathSegment);
    } else {
      crumbsHtml += `<li class='current'>${pathSegment}</li>`;
      break;
    }
  }

  breadcrumbs.innerHTML = crumbsHtml;
  const list = shopSelector.querySelector("#shopChildren");
  let listHtml = "";
  if (idx > 0) {
    console.log(idx);
    listHtml = `<li onclick="resetShopSelectorTo('${idx}');">Up</li>`;
  }
  if (page && page.children) {
    page.children.forEach((child) => {
      console.log(child);
      listHtml += `<li onclick="moveShopSelectorDown('${
        child.code || child.code
      }')"><i class='${child.type}'></i>${child.name}</li>`;
    });
  }
  list.innerHTML = listHtml;
};

window.selectShop = function () {
  let station = {};
  let page = { name: "universe", symbol: "UNIV", children: window.system };
  let classifications = [];
  let idx = 0;
  for (idx in window[window.popupMode + "Path"]) {
    const pathSegment = window[window.popupMode + "Path"][idx];
    const syntheticType =
      page.type ||
      (page.satellite && page.trade == "1"
        ? "outpost"
        : !page.satellite && page.trade
        ? "station"
        : "undefined");
    classifications.push({ code: page.code, type: syntheticType });
    if (page.children) {
      page = page.children.find((child) => child.code == pathSegment);
    } else {
      station = page;
      break;
    }
  }
  const syntheticType =
    page.type ||
    (page.satellite && page.trade == "1"
      ? "outpost"
      : !page.satellite && page.trade
      ? "station"
      : "undefined");

  classifications = [
    ...classifications.splice(1),
    { code: page.code, type: syntheticType },
  ];
  console.log(classifications);
  window[window.popupMode + "Station"] = page.code;
  let buttonBoxHtml = "";
  const buttonBox = document.getElementById(window.popupMode + "SelectorBox");
  classifications.forEach((classification, index) => {
    buttonBoxHtml += `<button class="source-selector source--${
      classification.type
    }" onclick="showShopSelector(${index}${
      window.popupMode == "dest" ? "', 'destination'" : ""
    })"><span class="source__label">${classification.code}</span></button>`;
  });
  document.getElementById(window.popupMode + "StationName").textContent =
    page.name;
  buttonBox.innerHTML = buttonBoxHtml;
  document.getElementById("shim").click();
  window.updateCommand();
};

window.moveShopSelectorDown = function (symbol) {
  window[window.popupMode + "Path"].push(symbol);
  console.log(symbol);
  window.updateShopSelector();
};

window.hidePopup = function (evt) {
  if (evt.srcElement == document.getElementById("shim")) {
    const shim = document.getElementById("shim");
    if (shim.forPopup) {
      const popup = document.getElementById(shim.forPopup);
      popup.hidden = true;
    }
    shim.hidden = true;
  }
};

    */

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  set onCloseCallback(newValue) {
    if (typeof newValue === "function") {
      this._onCloseCallback(newValue);
    }
    this.render();
  }

  set onAcceptCallback(newValue) {
    if (typeof newValue === "function") {
      this._onAcceptCallback(newValue);
    }
    this.render();
  }

  get onCloseCallback() {
    return this._onCloseCallback;
  }

  get onAcceptCallback() {
    return this._onAcceptCallback;
  }

  render() {
    this.innerHTML = "";
    if (this.isVisible) {
      this.className = "shim";
      this.id = "shim";
      this.addEventListener("click", () => {
        if (typeof this.onCloseCallback == "function") {
          this.onCloseCallback();
        }
      });

      const popup = document.createElement("div");
      popup.className = "popup";
      popup.id = "shopPopup";

      const header = document.createElement("header");
      header.textContent = "Refine Source";

      const pathList = document.createElement("ul");
      pathList.id = "currentPath";

      this.path.forEach((pathSegment) => {
        const pathListSegment = document.createElement("li");
        li.textContent = pathSegment;
        pathList.appendChild(pathListSegment);
      });

      const childrenList = document.createElement("ul");
      childrenList.id = "shopChildren";

      const buttonBox = document.createElement("div");
      buttonBox.className = "popup-actions";

      const acceptButton = document.createElement("button");
      acceptButton.textContent = "accept";

      acceptButton.addEventListener("click", () => {
        if (typeof this.onAcceptCallback === "function") {
          this.onAcceptCallback(this.path);
          this.visible = false;
        }
      });

      const cancelButton = document.createElement("button");
      cancelButton.addEventListener("click", () => {
        if (typeof this.onCloseCallback === "function") {
          this.onCloseCallback();
          this.visible = false;
        }
      });

      buttonBox.appendChild(acceptButton);
      buttonBox.appendChild(cancelButton);

      popup.appendChild(header);
      popup.appendChild(pathList);
      popup.appendChild(childrenList);
      popup.appendChild(buttonBox);

      this.appendChild(popup);
    }
  }
}

customElements.define("shop-popup", ShopPopup);
export default ShopPopup;
