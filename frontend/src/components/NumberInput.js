import React, { useEffect, useState } from "react";
import "./NumberInput.css";

function NumberInput({ onChange, value, min, max }) {
  const [innerValue, setInnerValue] = useState(value);

  const append = (symbol) => {
    if (innerValue == "0") {
      setInnerValue(symbol);
    } else {
      setInnerValue(innerValue + symbol);
    }
    onChange?.(innerValue + symbol);
  };

  const clear = () => {
    setInnerValue("");
  };

  useEffect(() => {
    setInnerValue(value);
    onChange?.(value);
  }, [value]);

  return (
    <div className="numberinput">
      <input
        value={innerValue}
        onChange={(event) => {
          setInnerValue(event.srcElement.value);
        }}
      />
      <button className="numberinput__button" onClick={() => append("7")}>
        7
      </button>
      <button className="numberinput__button" onClick={() => append("8")}>
        8
      </button>
      <button className="numberinput__button" onClick={() => append("9")}>
        9
      </button>
      <button className="numberinput__button" onClick={() => append("4")}>
        4
      </button>
      <button className="numberinput__button" onClick={() => append("5")}>
        5
      </button>
      <button className="numberinput__button" onClick={() => append("6")}>
        6
      </button>
      <button className="numberinput__button" onClick={() => append("1")}>
        1
      </button>
      <button className="numberinput__button" onClick={() => append("2")}>
        2
      </button>
      <button className="numberinput__button" onClick={() => append("3")}>
        3
      </button>
      <button className="numberinput__button" onClick={() => append("0")}>
        0
      </button>
      <button className="numberinput__button" onClick={() => append(".")}>
        .
      </button>
      <button
        className="numberinput__button button--harmful"
        onClick={() => clear()}
      >
        cls
      </button>
    </div>
  );
}

export default NumberInput;
