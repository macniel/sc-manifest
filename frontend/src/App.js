// import "./Casaba.css";
import './App.css';
import WelcomeScreen from "./components/WelcomeScreen";
import React, { useState } from "react";
import FleetManager from "./components/FleetManager";
import CommodityEntry from "./components/CommodityEntry";
import ManifestView from "./components/ManifestView";
import LogsView from "./components/LogsView";
import RefiningView from "./components/RefiningView";
import classNames from "classnames";

function App() {
  const [tab, setTab] = useState(-1);
  const [currentUser, setCurrentUser] = useState(false);

  const onFleetUpdate = () => {
    const commodityElement = document.querySelector("#commodity");
    commodityElement.classList.add("highlight");
    setTimeout(() => commodityElement.classList.remove("highlight"), 1000);
  };

  const onCargoChange = () => {
    const manifestElement = document.querySelector("#current");
    manifestElement.classList.add("highlight");
    setTimeout(() => manifestElement.classList.remove("highlight"), 1000);
  };

  const onLoginChange = (newLoginState) => {
    if (newLoginState) { // logged in with name
      setCurrentUser(newLoginState);
    } else { // not logged in
      setCurrentUser(false);
    }
  }

  const [tabList] = useState([
    {
      position: 0,
      name: "fleet",
      component: <FleetManager onFleetUpdate={onFleetUpdate} />,
    },
    {
      position: 1,
      name: "commodity",
      component: <CommodityEntry onCargoChange={onCargoChange} />,
    },
    {
      position: 2,
      name: "refined goods",
      component: <RefiningView onCargoChange={onCargoChange} />,
    },
    {
      position: 3,
      name: "current",
      manifest: "0",
      component: <ManifestView />,
    },
    { position: 4, name: "log", component: <LogsView /> },
  ]);

  return (
    <main>
      <header></header>
      <section>
        <div className="tab-bar">
          <ul className="tab-list">
            {tabList.map((tabItem) => {
              return (
                <li
                  key={`${tabItem.name}${tabItem.manifest ? "-" + tabItem.manifest : ""
                    }`}
                  id={tabItem.name}
                  className={classNames('tab', { 'active': tab === tabItem.position }
              )}
                  onClick={() => {
                    setTab(tabItem.position);
                  }}
                >
                  <span>{tabItem.name}</span>
                </li>
              );
            })}
            {currentUser ? <li className="tab-login"><button className="button--link" onClick={()=> setTab(-1)}>logged in as {currentUser}</button></li> : <li className="tab-login"><button className="button--link" onClick={()=> setTab(-1)}>click to login or register</button></li>}
          </ul>
          {tab === -1 ? <WelcomeScreen onLoginStateChange={onLoginChange} /> : tabList[tab].component}
        </div>
      </section>
    </main>
  );
}

export default App;
