import NumberInput from "./NumberInput.js";
import Webservices from "./Webservices.js";

window.commodity = "";
window.station = "";
window.quantity = 0;
window.price = 0.0;

window.processCommand = async function (commandSelector) {
  const response = await fetch(`/buy/${window.selectedManifest}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timestamp: Date.now,
      commodity: window.commodity,
      shop: window.sourceStation,
      qty: window.quantity.toFixed(0),
      price: window.price.toFixed(2),
    }),
  }).then((response) => response.json());
  renderManifest(response);
};

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
    listHtml = `<li onclick="resetShopSelectorTo('${idx}');">Up</li>`;
  }
  if (page && page.children) {
    page.children.forEach((child) => {
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
    { code: page.code, type: syntheticType, name: page.name },
  ];
  window[window.popupMode + "Station"] = page.code;
  if (
    window.popupAcceptCallback &&
    typeof window.popupAcceptCallback == "function"
  ) {
    window.popupAcceptCallback({
      path: classifications,
      code: page.code,
    });
  }

  document.getElementById("shim").click();
};

window.moveShopSelectorDown = function (symbol) {
  window[window.popupMode + "Path"].push(symbol);
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

window.renderManifest = function (data) {
  if (data.isArchived) {
    return;
  }
  const targetTable = document.getElementById("manifest");
  targetTable.innerHTML = "";
  let markup = "";
  let filledUp = 0;
  data.transactions.forEach((set) => {
    let soldGoods = 0;
    let historyMarkup = "";
    if (set.history) {
      set.history.forEach((historyline) => {
        const shopDetails = window.stations.find(
          (shop) =>
            shop.code == historyline.destination ||
            shop.symbol == historyline.destination
        );
        soldGoods += historyline.quantity;
        historyMarkup += `<tr><td></td><td>${
          shopDetails ? shopDetails.name : historyline.destination
        }</td><td class='as-number'>${
          historyline.quantity
        } cSCU</td><td class='as-number'>${historyline.price.toFixed(
          2
        )} aUEC</td></tr>`;
      });
    }

    filledUp += Math.ceil(set.quantity / 100);

    const commodityDetails = window.commodities.find(
      (commodity) => commodity.code == set.commodity
    );
    const shopDetails = window.stations.find(
      (shop) => shop.code == set.shop || shop.symbol == set.shop
    );

    const tr = document.createElement("tr");
    tr.transaction = set.transaction;
    tr.dataset.transaction = set.transaction;

    const nameCell = document.createElement("td");
    nameCell.textContent = commodityDetails.name;
    tr.appendChild(nameCell);

    const shopCell = document.createElement("td");
    shopCell.textContent = shopDetails ? shopDetails.name : set.shop;
    tr.appendChild(shopCell);

    const quantityCell = document.createElement("td");
    quantityCell.className = "as-number";
    quantityCell.textContent =
      set.quantity - soldGoods + "/" + set.quantity + " cSCU";
    tr.appendChild(quantityCell);

    const priceCell = document.createElement("td");
    priceCell.className = "as-number";
    priceCell.textContent = set.price + " aUEC";
    tr.appendChild(priceCell);

    const actions = document.createElement("td");
    actions.className = "manifest-item-actions";

    const dumpButton = document.createElement("button");
    dumpButton.className = "manifest-item-action action--harmful action-drop";
    dumpButton.addEventListener("dblclick", () => {
      dump(data.manifest, set.transaction);
    });

    const sellButton = document.createElement("button");
    sellButton.className = "manifest-item-action action action-sell";
    if (set.quantity - soldGoods == 0) {
      sellButton.classList.add("action-disabled");
    }
    sellButton.addEventListener("click", () => {
      sell(set);
    });
    actions.appendChild(dumpButton);
    actions.appendChild(sellButton);

    tr.appendChild(actions);
    targetTable.appendChild(tr);
    tr.insertAdjacentHTML("afterend", historyMarkup);
  });
  const ship = window.ships.find((ship) => ship.code === data.ship);
  ship.scu;
  document.querySelector(
    `[data-manifest="${data.manifest}"]`
  ).textContent = `${ship.name}(${filledUp}/${ship.scu})`;

  const infoPre = document.getElementById("manifest-info");
  infoPre.textContent = `ManifestId: ${data.manifest}\nShip: ${ship.manufacturer} ${ship.name}\nCargo: ${filledUp}/${ship.scu} SCU`;
};

window.dump = async function (manifest, transaction) {
  await fetch(`/dump/${manifest}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: transaction.transaction }),
  })
    .then((response) => response.json())
    .then((data) => renderManifest(data.filter((tx) => !tx.isArchived)));
};

window.sealManifest = async function () {
  fetch("seal-manifest", {
    method: "POST",
  })
    .then((response) => response.json())
    .then((data) => renderManifest(data.filter((tx) => !tx.isArchived)));
};

window.sell = function (transaction) {
  const transactionItem = document.querySelector(
    `[data-transaction="${transaction.transaction}"]`
  );
  if (transactionItem.parentNode.querySelector(".sellline")) {
    transactionItem.parentNode.removeChild(
      transactionItem.parentNode.querySelector(".sellline")
    );
  }
  const quantity = new NumberInput();
  quantity.value = parseInt(transaction.quantity);
  quantity.max = parseInt(transaction.quantity);
  quantity.label = "cSCU";
  quantity.size = 8;

  const price = new NumberInput();
  price.value = parseFloat(transaction.price);
  price.label = "aUEC";
  price.size = 6;
  price.fraction = 2;

  transactionItem.insertAdjacentHTML(
    "afterend",
    `<tr class='sellline'>
        <td></td>
        <td><div class="source-selector--outer">
        <div id='destSelectorBox'>
            <button class="source-selector source--star" onclick="showShopSelector(0, 'destination')"><span class="source__label">ST</span></button>
        </div>
        <span id='destStationName'></span></td>
        <td id='quantity'>
        </td>
        <td id='price'>       
        </td>
        <td><button id='confirmsell'>Confirm</button></td></tr>`
  );
  document.querySelector(".sellline #quantity").appendChild(quantity);
  document.querySelector(`.sellline #price`).appendChild(price);
  document
    .querySelector(".sellline #confirmsell")
    .addEventListener("click", () => {
      Webservices.instance.wsSellFromManifest(window.selectedManifest, {
        transaction: transaction.transaction,
        price: price.value,
        quantity: quantity.value,
        shop: "MICTD",
      });
    });
};

window.resetLog = function () {
  const table = document.querySelector("#manifestList");
  table.innerHTML = "";
};

const dateTimeFormatter = Intl.DateTimeFormat(navigator.language, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
});

window.renderLog = function (manifest) {
  const table = document.querySelector("#manifestList");
  let tableMarkup = table.innerHTML;
  const graph = manifest.commodities.map((commodity) => {
    return `<div title="${
      window.commodities.find((c) => c.code === commodity.code).name
    }" class="${commodity.code}" style="width: ${
      (commodity.volume / manifest.volume) * 100
    }%">${commodity.code}</div>`;
  });

  tableMarkup += `<tr><td>${dateTimeFormatter.format(
    new Date(manifest.timestamp)
  )}</td><td>${
    window.ships.find((ship) => ship.code === manifest.ship).name
  }</td><td><div class="fill-meter">${graph.join(
    ""
  )}</div></td><td class="as-number">${
    manifest.volume
  } cSCU</td><td class="as-number">${manifest.profit.toFixed(
    2
  )} aUEC</td></tr>`;

  table.innerHTML = tableMarkup;
};

window.archiveManifest = function () {
  Webservices.instance.wsArchiveManifest(window.selectedManifest);
};

window.switchToTab = function (tabName, manifest) {
  document.querySelectorAll("#tabBar li").forEach((tab) => {
    document.querySelectorAll("section").forEach((section) => {
      if (section.id == tabName) {
        section.hidden = false;
      } else {
        section.hidden = true;
      }
    });

    if (tab.id.indexOf("tabHeader-" + tabName) != -1) {
      if (tabName === "current") {
        if (tab.dataset.manifest === manifest) {
          window.selectedManifest = manifest;
          tab.classList.add("active");
          tab.classList.add("to");
          Webservices.instance.wsGetManifest(manifest);
        } else {
          tab.classList.remove("active");
          tab.classList.remove("to");
        }
      } else {
        tab.classList.add("active");
      }
    } else {
      tab.classList.remove("active");
    }
  });
};

Webservices.instance.addEventListener("manifest", (manifestData) => {
  if (manifestData.transactions && !manifestData.isArchived) {
    createTab(manifestData.manifest);
    renderManifest(manifestData);
  }
});

Webservices.instance.addEventListener("manifest", (manifestData) => {
  if (manifestData && manifestData.manifest) {
    let holdManifests = [];
    if (localStorage.getItem("manifests")) {
      holdManifests = JSON.parse(localStorage.getItem("manifests"));
    }
    if (!holdManifests.find((manifest) => manifestData.manifest === manifest)) {
      holdManifests.push(manifestData.manifest);
      localStorage.setItem("manifests", JSON.stringify(holdManifests));
    }
  }
});

Webservices.instance.addEventListener("log", (data) => {
  if (data && data.manifest && data.isArchived) {
    window.renderLog(data);
  }
});

((log) => {
  const logs = JSON.parse(log);
  logs?.forEach((log) => {
    Webservices.instance.wsGetLog(log);
  });
})(localStorage.getItem("logs"));

Webservices.instance.addEventListener("archived", (data) => {
  if (data && data.manifest) {
    let holdLogs = [];
    if (localStorage.getItem("logs")) {
      holdLogs = JSON.parse(localStorage.getItem("logs"));
    }
    if (!holdLogs.find((manifest) => data.manifest === manifest)) {
      holdLogs.push(data.manifest);
      localStorage.setItem("logs", JSON.stringify(holdLogs));
    }
    window.resetLog();
    // retrieve logs
    holdLogs.forEach((log) => {
      Webservices.instance.wsGetLog(log);
    });
    // update Tabs
    updateTabs();
    document.querySelector("#tabHeader-fleet").click();
  }
});

window.createTab = (manifest) => {
  if (!tabBar.querySelector(`[data-manifest="${manifest}"]`)) {
    const tabBar = document.querySelector("#tabBar");
    const tab = document.createElement("li");
    tab.addEventListener("click", () => {
      switchToTab("current", manifest);
    });
    tab.dataset.manifest = manifest;
    tab.id = "tabHeader-current";
    tab.textContent = "";
    tabBar
      .querySelector("li:nth-child(2)")
      .insertAdjacentElement("afterend", tab);
  }
};

window.updateTabs = () => {
  const tabBar = document.querySelector("#tabBar");
  tabBar.innerHTML = "";

  const fleetTab = document.createElement("li");
  fleetTab.addEventListener("click", () => {
    switchToTab("fleet");
  });
  fleetTab.id = "tabHeader-fleet";
  fleetTab.textContent = "Fleet";
  tabBar.appendChild(fleetTab);

  const entryTab = document.createElement("li");
  entryTab.addEventListener("click", () => {
    switchToTab("entry");
  });
  entryTab.id = "tabHeader-entry";
  entryTab.textContent = "Add Commodity";
  tabBar.appendChild(entryTab);

  const historyTab = document.createElement("li");
  historyTab.addEventListener("click", () => {
    switchToTab("log");
  });
  historyTab.id = "tabHeader-log";
  historyTab.textContent = "Log";
  tabBar.appendChild(historyTab);
  if (localStorage.getItem("manifests")) {
    const holdManifests = JSON.parse(localStorage.getItem("manifests"));
    holdManifests.forEach((manifest) => {
      createTab(manifest);
      Webservices.instance.wsGetManifest(manifest);
    });
  }
};

(() => {
  updateTabs();
})();
