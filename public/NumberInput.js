class NumberInput extends HTMLElement {
  static get observedAttributes() {
    return ["size", "value", "label", "onchange", "fraction", "min", "max"];
  }

  constructor() {
    super();
  }

  innerAdjustValue(amount) {
    const previousValue = this._value;
    this._value += amount || 0;
    if (this._value < this._min) {
      this._value = this._min;
    }
    if (previousValue != amount && typeof this._callback === "function") {
      this._callback(this._value);
    }
    this.render();
  }

  set value(newValue) {
    this._value = newValue;
    this.render();
  }

  set size(newValue) {
    this._size = newValue;
    this.render();
  }

  set label(newValue) {
    this._label = newValue;
    this.render();
  }

  set min(newValue) {
    this._min = newValue;
    this.render();
  }

  set fraction(newValue) {
    this._fraction = newValue;
    this.render();
  }

  set max(newValue) {
    this._max = newValue;
    this.render();
  }

  set onChange(newValue) {
    this._callback = newValue;
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "size") {
      this._size = parseInt(newValue);
    }
    if (name === "value") {
      this._value = parseFloat(newValue);
    }
    if (name === "label") {
      this._label = newValue;
    }
    if (name === "fraction") {
      this._fraction = parseInt(newValue);
    }
    if (name === "min") {
      this._min = parseFloat(newValue);
    }
    if (name === "max") {
      this._max = parseFloat(newValue);
    }
    if (name === "onchange") {
      if (typeof window[newValue] === "function") {
        this._callback = window[newValue];
      }
    }
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = "";
    this.className = "touchnumberinput";
    const buttonPanelTop = document.createElement("div");
    const buttonPanelBottom = document.createElement("div");
    const inputPanel = document.createElement("div");
    for (let i = this._size || 0; i >= 0; --i) {
      const buttonTop = document.createElement("button");
      buttonTop.textContent = "▲";
      buttonTop.addEventListener("click", () =>
        this.innerAdjustValue(10 ** (i - (this._fraction || 0)))
      );
      buttonTop.title = `increase value by ${10 ** i}`;
      buttonPanelTop.appendChild(buttonTop);

      const buttonBottom = document.createElement("button");
      buttonBottom.textContent = "▼";
      buttonBottom.addEventListener("click", () =>
        this.innerAdjustValue(-(10 ** (i - (this._fraction || 0))))
      );
      buttonBottom.title = `decrease value by ${10 ** i}`;
      buttonPanelBottom.appendChild(buttonBottom);
      if (this._fraction && i == this._fraction) {
        const spacerTop = document.createElement("div");
        spacerTop.className = "period-spacer";
        buttonPanelTop.appendChild(spacerTop);
        const spacerBottom = document.createElement("div");
        spacerBottom.className = "period-spacer";
        buttonPanelBottom.appendChild(spacerBottom);
      }
    }
    buttonPanelTop.className = "increase";
    buttonPanelBottom.className = "decrease";
    inputPanel.className = "inner";

    const inputField = document.createElement("input");
    inputField.type = "number";
    inputField.addEventListener("change", () => {
      if (typeof this._callback == "function") {
        this._callback(this._value);
      }
    });
    inputField.min = this._min;
    inputField.pattern = `pattern="[0-9]+([\.,][0-9]+)?"`;
    if (this._fraction) {
      inputField.step = 10 ** -this._fraction;
    } else {
      inputField.step = 1;
    }

    inputField.value = (this._value || 0).toFixed(this._fraction || 0);

    const label = document.createElement("span");
    label.textContent = this._label;

    inputPanel.appendChild(inputField);
    inputPanel.appendChild(label);

    this.appendChild(buttonPanelTop);
    this.appendChild(inputPanel);
    this.appendChild(buttonPanelBottom);
  }
}

customElements.define("number-input", NumberInput);
export default NumberInput;
