import React, { useState } from "react";
import "./NumberInput.css";

function NumberInput({ onChange, value, min, max }) {
  const [innerValue, setInnerValue] = useState(value);

  const append = (symbol) => {
    setInnerValue(innerValue + symbol);
  };

  const clear = () => {
    setInnerValue("");
  };

  const confirm = () => {
    onChange?.(innerValue);
  };

  return (
    <div className="numberinput">
      <input
        value={innerValue}
        onChange={(event) => {
          setInnerValue(event.srcElement.value);
        }}
      />
      <button onClick={() => append("7")}>7</button>
      <button onClick={() => append("8")}>8</button>
      <button onClick={() => append("9")}>9</button>
      <button onClick={() => append("4")}>4</button>
      <button onClick={() => append("5")}>5</button>
      <button onClick={() => append("6")}>6</button>
      <button onClick={() => append("1")}>1</button>
      <button onClick={() => append("2")}>2</button>
      <button onClick={() => append("3")}>3</button>
      <button onClick={() => append("0")}>0</button>
      <button onClick={() => append(".")}>.</button>
      <button onClick={() => clear()}>cls</button>
      <button className="confirm" onClick={() => confirm()}>
        ok
      </button>
    </div>
  );
}

export default NumberInput;
