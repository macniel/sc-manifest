window.commodity = "";
window.station = "";
window.quantity = 0;
window.price = 0.0;

window.toggleRaw = function (fieldsetId) {
  document
    .querySelector(fieldsetId)
    .querySelectorAll("button")
    .forEach((button) => {
      console.log(button.dataset);
      if (button.dataset.raw === "true") {
        button.hidden = !button.hidden;
      }
    });
};

window.setCommodity = function (event, symbol) {
  window.commodity = symbol;
  document
    .getElementById("commoditySelector")
    .querySelectorAll("button")
    .forEach((button) => {
      if (button == event.srcElement) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  updateCommand();
};

window.adjustQtyBy = function (amount) {
  window.quantity = parseInt(window.quantity) + amount;
  document.getElementById("qty").value = window.quantity;
  updateCommand();
};

window.setQtyTo = function (amount) {
  window.quantity = parseInt(amount);
  updateCommand();
};

window.adjustPriceBy = function (amount) {
  window.price = parseFloat(window.price) + amount;
  document.getElementById("price").value = window.price.toFixed(2);
  updateCommand();
};

window.setPriceTo = function (amount) {
  window.price = parseFloat(amount);
  updateCommand();
};

window.updateCommand = function () {
  document.getElementById("commandline").textContent = `${window.commodity} ${
    window.station
  } ${window.quantity.toFixed(0)}@${window.price.toFixed(2)}`;
  window.command = document.getElementById("commandline").textContent;
  localStorage.setItem("command", window.command);
};

window.processCommand = async function (commandSelector) {
  console.log(
    "sending command to trade central",
    document.querySelector(commandSelector).textContent
  );
  const response = await fetch("/buy", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timestamp: Date.now,
      commodity: window.commodity,
      shop: window.station,
      qty: window.quantity.toFixed(0),
      price: window.price.toFixed(2),
    }),
  }).then((response) => response.json());
  renderManifest(response);
};

window.shopPath = ["ST"];
window.showShopSelector = function (resetToSegment) {
  const shim = document.getElementById("shim");
  const popup = document.getElementById("shopPopup");
  shim.hidden = false;
  shim.forPopup = "shopPopup";
  popup.hidden = false;
  if (resetToSegment) {
    window.resetShopSelectorTo(resetToSegment);
  } else {
    window.updateShopSelector();
  }
};

window.resetShopSelectorTo = function (position) {
  window.shopPath = window.shopPath.splice(0, position);
  window.updateShopSelector();
};

window.updateShopSelector = function () {
  const shopSelector = document.querySelector("#shopPopup");
  const breadcrumbs = shopSelector.querySelector("#currentPath");
  let page = { name: "universe", symbol: "UNIV", children: window.system };
  let crumbsHtml = "";
  let idx = 0;
  for (idx in window.shopPath) {
    const pathSegment = window.shopPath[idx];
    console.log(window.shopPath);
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
  for (idx in window.shopPath) {
    const pathSegment = window.shopPath[idx];
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
  window.station = page.code;
  let buttonBoxHtml = "";
  const buttonBox = document.getElementById("sourceSelectorBox");
  classifications.forEach((classification, index) => {
    buttonBoxHtml += `<button class="source-selector source--${classification.type}" onclick="showShopSelector(${index})"><span class="source__label">${classification.code}</span></button>`;
  });
  document.getElementById("sourceStationName").value = page.name;
  buttonBox.innerHTML = buttonBoxHtml;
  document.getElementById("shim").click();
  window.updateCommand();
};

window.moveShopSelectorDown = function (symbol) {
  window.shopPath.push(symbol);
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

((command) => {
  const splitted = command.split(" ");
  if (splitted.length == 3) {
    window.commodity = splitted[0];
    window.station = splitted[1];
    [window.quantity, window.price] = splitted[2].split("@");
  } else if (splitted.length == 2) {
    window.commodity = splitted[0];
    [window.quantity, window.price] = splitted[1].split("@");
  }
  window.quantity = parseInt(window.quantity);
  window.price = parseFloat(window.price);
  updateCommand();
})(localStorage.getItem("command"));

(() => {
  fetch("/manifest")
    .then((response) => response.json())
    .then((data) => renderManifest(data));
})();

window.renderManifest = function (data) {
  const targetTable = document.getElementById("manifest");
  targetTable.innerHTML = "";
  let markup = "";
  data.forEach((set) => {
    markup += `<tr><td>${set.commodity}</td><td>${set.shop}</td><td>${set.quantity} SCU</td><td>${set.price} aUEC</td><td><input type='number'><button>sell</button></td>`;
  });
  targetTable.innerHTML = markup;
};
