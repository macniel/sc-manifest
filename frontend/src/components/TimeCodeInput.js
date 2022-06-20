import React, { useEffect, useState } from "react";
import "./NumberInput.css";

function TimeCodeInput({ onChange, value }) {
  const [innerValue, setInnerValue] = useState(value);

  const getNextSymbol = (value) => {
    if (!value)
      return 'd';
    if (value.indexOf('d') >= 0)
      if (value.indexOf('h') >= 0)
        if (value.indexOf('m') >= 0)
          if (value.indexOf('s') >= 0)
            return
          else
            return 's'
        else
          return 'm'
      else
        return 'h'
    else
      return 'd'
  }

  const append = (symbol) => {
    let iV = innerValue;

    if (symbol === 'dhms') {
      let lastSymbol = iV[iV.length - 1] || '';
      if (!lastSymbol.match(/\d/)) {
        iV += '0';
      }
      iV += getNextSymbol(iV);
    } else {
      iV += symbol;
    }
    setInnerValue(iV);
    onChange?.(iV);
    
  };

  const clear = () => {
    setInnerValue("");
  };

  useEffect(() => {
    let v = value;
    if (!value || Number.isNaN(value)) {
      v = 0;
    }
    setInnerValue(v);
    onChange?.(v);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="numberinput">
      <input
        aria-label="input value"
        value={innerValue}
        onChange={(event) => {
          if (event.target) {
            setInnerValue(event.target.value);
          }
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
      <button className="numberinput__button" onClick={() => append('dhms')}>
        {getNextSymbol(innerValue)}
      </button>
      <button className="numberinput__button" onClick={() => append("0")}>
        0
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

export default TimeCodeInput;
