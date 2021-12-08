class Webservices {
  constructor() {
    this.eventListeners = {
      manifest: [],
      ships: [],
      log: [],
    };
  }

  wsGetManifest(manifestId) {
    fetch(`/manifest/${manifestId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        this.eventListeners["manifest"].forEach((listener) => listener(data));
      });
  }

  wsListShips() {
    fetch("/ships")
      .then((response) => response.json())
      .then((ships) => {
        this.eventListeners["ships"].forEach((listener) => listener(ships));
      });
  }

  wsCreateManifest(forShip) {
    const shipDetail = window.ships.find((ship) => ship.code === forShip);
    if (shipDetail) {
      fetch(`/create`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: forShip }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("create manifest");
          this.eventListeners["manifest"].forEach((listener) => listener(data));
        });
    }
  }

  wsArchiveManifest(manifest) {
    fetch(`/archive/${manifest}`)
      .then((response) => response.json())
      .then((data) => {
        if (data) {
          this.eventListeners["log"].forEach((listener) => listener(data));
        }
      });
  }

  wsSellFromManifest(manifest, { transaction, price, quantity, shop }) {
    const payload = {
      transaction,
      shop,
      price,
      quantity,
    };
    fetch(`/sell/${manifest}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) =>
        this.eventListeners["manifest"].forEach((listener) => listener(data))
      );
  }

  wsAddToManifest(manifestId, { commodity, shop, quantity, price }) {
    console.log(this.eventListeners);
    fetch(`/buy/${manifestId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timestamp: Date.now,
        commodity: commodity.code,
        shop: shop,
        qty: quantity.toFixed(0),
        price: price.toFixed(2),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        this.eventListeners["manifest"].forEach((listener) => listener(data));
      });
  }

  addEventListener(event, callback) {
    if (typeof callback === "function")
      this.eventListeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (typeof callback === "function") {
      this.eventListeners[event] = this.eventListeners[event].filter(
        (fn) => fn === callback
      );
    }
  }

  static get instance() {
    if (!Webservices._instance) {
      Webservices._instance = new Webservices();
    }
    return Webservices._instance;
  }
}

export default Webservices;
