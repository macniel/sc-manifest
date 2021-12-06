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

window.adjustQtyBy = function (amount, isDestination) {
  window[isDestination ? "destQuantity" : "quantity"] =
    parseInt(window[isDestination ? "destQuantity" : "quantity"] || 0) + amount;
  document.getElementById([isDestination ? "destQty" : "qty"]).value =
    window[isDestination ? "destQuantity" : "quantity"];
  updateCommand();
};

window.setQtyTo = function (amount, isDestination) {
  window[isDestination ? "destQuantity" : "quantity"] = parseInt(amount) || 0;
  updateCommand();
};

window.adjustPriceBy = function (amount, isDestination) {
  window[isDestination ? "destPrice" : "price"] =
    parseFloat(window[isDestination ? "destPrice" : "price"] || 0) + amount;
  document.getElementById([isDestination ? "destPrice" : "price"]).value =
    window[isDestination ? "destPrice" : "price"].toFixed(2);
  updateCommand();
};

window.setPriceTo = function (amount) {
  window[isDestination ? "destPrice" : "price"] = parseFloat(amount || 0);
  updateCommand();
};

window.updateCommand = function () {
  document.getElementById("commandline").textContent = `${window.commodity} ${
    window.sourceStation
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
  if (resetToSegment) {
    window.resetShopSelectorTo(resetToSegment);
  } else {
    window.updateShopSelector();
  }
};

window.resetShopSelectorTo = function (position) {
  window[window.popupMode + "Path"] = window[window.popupMode + "Path"].splice(
    0,
    position
  );
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
    }" click="showShopSelector(${index}${
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

    const commodityDetails = window.commodities.find(
      (commodity) => commodity.code == set.commodity
    );
    const shopDetails = window.stations.find(
      (shop) => shop.code == set.shop || shop.symbol == set.shop
    );
    markup += `<tr data-transaction="${set.transaction}"><td>${
      commodityDetails.name
    }</td><td>${
      shopDetails ? shopDetails.name : set.shop
    }</td><td class='as-number'>${set.quantity - soldGoods}/${
      set.quantity
    } cSCU</td><td class='as-number'>${
      set.price
    } aUEC</td><td class="manifest-item-actions"><button class="manifest-item-action action--harmful" ondblclick="dump('${
      set.transaction
    }')">dump</button><button class="manifest-item-action action ${
      set.quantity - soldGoods == 0 ? "action-disabled" : ""
    }" onclick="sell('${set.transaction}')">sell</button></td></tr>`;
    markup += historyMarkup;
  });
  document.getElementById(
    "tabHeader-current"
  ).textContent = `Manifest (${data.length}/0)`;
  targetTable.innerHTML = markup;
};

window.dump = async function (transaction) {
  await fetch("/dump", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction }),
  })
    .then((response) => response.json())
    .then((data) => renderManifest(data));
};

window.sell = function (transaction) {
  // TODO: show popup for sell information
  const transactionItem = document.querySelector(
    `[data-transaction="${transaction}"]`
  );
  console.log(transactionItem);
  if (transactionItem.parentNode.querySelector(".sellline")) {
    transactionItem.parentNode.removeChild(
      transactionItem.parentNode.querySelector(".sellline")
    );
  }
  transactionItem.insertAdjacentHTML(
    "afterend",
    `<tr class='sellline'>
        <td></td>
        <td><div class="source-selector--outer">
        <div id='destSelectorBox'>
            <button class="source-selector source--star" onclick="showShopSelector(0, 'destination')"><span class="source__label">ST</span></button>
        </div>
        <span id='destStationName'></span></td>
        <td><div class="touchnumberinput">
        <div class="increase">
            <button onclick="adjustQtyBy(10000000, 'destination')" title='increase value by 1000000'>▲</button>
            <button onclick="adjustQtyBy(1000000, 'destination')" title='increase value by 100000'>▲</button>
            <button onclick="adjustQtyBy(100000, 'destination')" title='increase value by 10000'>▲</button>
            <button onclick="adjustQtyBy(10000, 'destination')" title='increase value by 1000'>▲</button>
            <button onclick="adjustQtyBy(1000, 'destination')" title='increase value by 1000'>▲</button>
            <button onclick="adjustQtyBy(100, 'destination')" title='increase value by 100'>▲</button>
        <button onclick="adjustQtyBy(10, 'destination')" title='increase value by 10'>▲</button>
        <button onclick="adjustQtyBy(1, 'destination')" title='increase value by 1'>▲</button></div>
        <div class="inner"><input type="number" id="destQty" onchange="setQtyTo(event.target.value, 'destination')" pattern="[0-9]+([\.,][0-9]+)?" step="1"> cSCU</div>
        <div class="decrease">
                <button onclick="adjustQtyBy(-10000000, 'destination')" title='decrease value by 10000000'>▼</button>
                <button onclick="adjustQtyBy(-1000000, 'destination')" title='decrease value by 1000000'>▼</button>
                <button onclick="adjustQtyBy(-100000, 'destination')" title='decrease value by 100000'>▼</button>
        <button onclick="adjustQtyBy(-10000, 'destination')" title='decrease value by 10000'>▼</button>
            <button onclick="adjustQtyBy(-1000, 'destination')" title='decrease value by 1000'>▼</button>
        <button onclick="adjustQtyBy(-100, 'destination')" title='decrease value by 100'>▼</button>
        
        <button onclick="adjustQtyBy(-10, 'destination')" title='decrease value by 10'>▼</button>
        <button onclick="adjustQtyBy(-1, 'destination')" title='decrease value by 1'>▼</button></div>
    </div></td>
        <td><div class="touchnumberinput">
        <div class="increase">
        <button onclick="adjustPriceBy(10000, 'destination')" title='increase value by 10000'>▲</button>
        <button onclick="adjustPriceBy(1000, 'destination')" title='increase value by 1000'>▲</button>
        <button onclick="adjustPriceBy(100, 'destination')" title='increase value by 100'>▲</button>
        <button onclick="adjustPriceBy(10, 'destination')" title='increase value by 10'>▲</button>
        <button onclick="adjustPriceBy(1, 'destination')" title='increase value by 1'>▲</button>
        <div class="period-spacer"></div>
        <button onclick="adjustPriceBy(0.1, 'destination')" title='increase value by a tenth'>▲</button>
        <button onclick="adjustPriceBy(0.01, 'destination')" title='increase value by a hundreth'>▲</button>
        </div>
        <div class="inner"><input type="number" id="destPrice" onchange="setQtyTo(event.target.value, 'destination')" pattern="[0-9]+([\.,][0-9]+)?" step="0.01"><label for="price">aUEC</label></div>
        <div class="decrease">
        <button onclick="adjustPriceBy(-10000, 'destination')" title='decrease value by 10000'>▼</button>    
        <button onclick="adjustPriceBy(-1000, 'destination')" title='decrease value by 1000'>▼</button>    
        <button onclick="adjustPriceBy(-100, 'destination')" title='decrease value by 100'>▼</button>    
        <button onclick="adjustPriceBy(-10, 'destination')" title='decrease value by 10'>▼</button>    
        <button onclick="adjustPriceBy(-1, 'destination')" title='decrease value by 1'>▼</button>    
        <div class="period-spacer"></div>
        <button onclick="adjustPriceBy(-0.1, 'destination')" title='decrease value by a tenth'>▼</button>
        
        <button onclick="adjustPriceBy(-0.01, 'destination')" title='decrease value by a hundreth'>▼</button>
        </div>
    </div></td>
        <td><button onclick="sellCommodityFromTransaction('${transaction}')">Confirm</button></td></tr>`
  );
};

window.sellCommodityFromTransaction = function (transaction) {
  const payload = {
    transaction,
    shop: window.destStation,
    price: window.destPrice,
    quantity: window.destQuantity,
  };
  fetch("/sell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => renderManifest(data));
};

window.switchToTab = function (tabName) {
  document.querySelectorAll("#tabBar li").forEach((tab) => {
    document.querySelectorAll("section.manifest").forEach((section) => {
      if (section.classList.contains("manifest--" + tabName)) {
        section.hidden = false;
      } else {
        section.hidden = true;
      }
    });

    if (tab.id.indexOf("tabHeader-" + tabName) != -1) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
};
