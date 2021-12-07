class Webservices {
  constructor() {
    this.eventListeners = {
      manifest: [],
    };
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
        shop: shop.code,
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
