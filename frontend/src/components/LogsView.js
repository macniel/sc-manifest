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
          {logs.map((log) => (
            <div className="log">
              <div className="log__name">{log.associatedShip?.name}</div>
              <div className="log__scu">{log.associatedShip?.scu} cSCU</div>
              <div
                className={classNames("log__profit", {
                  negative: log.profit < 0,
                  positive: log.profit >= 0,
                })}
              >
                {log.profit.toFixed(2)} aUEC
              </div>
              <div className="meter">
                {log.commodities.map((commodity) => (
                  <div
                    className="fill"
                    style={{
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
    </div>
  );
}

export default LogsView;
