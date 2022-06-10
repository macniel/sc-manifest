import classNames from "classnames";
import React, { useEffect, useState } from "react";
import "./LogsView.css";

function LogsView() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
      fetch("api/logs").then(res => res.json()).then(setLogs);
  }, []);

  return (
    <div className="log-view">
      <fieldset>
        <legend>Logs</legend>

        <div className="logs">
          {logs.length > 0 && logs.map((log) => (
            <div className="log" key={log.manifest}>
              <div className="log__name">{log.associatedShip?.name || log.shipNameCopy}</div>
              <div className="log__scu">{log.commodities?.reduce((value, commodity) => { return value += parseInt(commodity.total) }, 0)} cSCU</div>
              <div
                className={classNames("log__profit", {
                  negative: log.profit < 0,
                  positive: log.profit >= 0,
                })}
              >
                {log.profit.toFixed(2)} aUEC
              </div>
              <div className="meter">
                {log.commodities.map((commodity, index) => (
                  <div 
                    key={log.manifest + commodity.name}
                    className="fill"
                    style={{
                      "--perc-loss": (commodity.cost / commodity.profit * 100).toFixed(2) + "%",
                      width:
                        Math.floor(commodity.total / log.associatedShip?.scu) +
                        "%",
                    }}
                  >
                    {commodity.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        
      </fieldset>
      <fieldset>
        <legend>Legend</legend>
        <div className="legend">
        <label>
          <div className="log">
            <div className="meter" style={{width: "24px", height: "24px"}}></div>
          </div>
          Empty Space
        </label>
        <label>
          <div className="log">
            <div className="meter" style={{ width: "24px", height: "24px" }}>
              <div className="fill" style={{"--perc-loss": "100%", "width": "100%"}}></div>
            </div>
          </div>
          Loss
        </label>
        <label>
          <div className="log">
            <div className="meter" style={{ width: "24px", height: "24px" }}>
              <div className="fill" style={{"--perc-loss": "0%", "width": "100%"}}></div>
            </div>
          </div>
          Win
          </label>
          </div>
      </fieldset>
    </div>
  );
}

export default LogsView;
