import classNames from "classnames";
import React, { useEffect, useState } from "react";
import "./LogsView.css";

function LogsView() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const logHandler = () => {
      const logItems = JSON.parse(localStorage.getItem("logs") || []);
      console.log(logItems);
      const log = logItems.map(
        async (logItem) =>
          await fetch("/api/log/" + logItem).then((response) => response.json())
      );
      Promise.all(log).then((result) => {
        console.log(result);
        setLogs(result);
      });
    };
    window.addEventListener("storage", logHandler);
    logHandler();

    return () => {
      window.removeEventListener("storage", logHandler);
    };
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
                    {commodity.code}
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
