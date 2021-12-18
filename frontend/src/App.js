import "./App.css";
import WelcomeScreen from "./components/WelcomeScreen";
import { useState, useEffect } from "react";
import FleetManager from "./components/FleetManager";
import CommodityEntry from "./components/CommodityEntry";
import ManifestView from "./components/ManifestView";
import LogsView from "./components/LogsView";

function App() {
  const [tab, setTab] = useState(-1);

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
      name: "current",
      manifest: "0",
      component: <ManifestView />,
    },
    { position: 3, name: "log", component: <LogsView /> },
  ]);

  useEffect(() => {
    function checkManifest() {
      const item = localStorage.getItem("manifests");

      if (item) {
        console.log(item);
        // get head from server
      }
    }

    window.addEventListener("storage", checkManifest);

    return () => {
      window.removeEventListener("storage", checkManifest);
    };
  }, []);

  return (
    <main>
      <header></header>
      <section>
        <div className="tab-bar">
          <ul className="tab-list">
            {tabList.map((tabItem) => {
              return (
                <li
                  key={`${tabItem.name}${
                    tabItem.manifest ? "-" + tabItem.manifest : ""
                  }`}
                  id={tabItem.name}
                  className={tab === tabItem.position ? "active" : ""}
                  onClick={() => {
                    setTab(tabItem.position);
                  }}
                >
                  {tabItem.name}
                </li>
              );
            })}
          </ul>
          {tab === -1 ? <WelcomeScreen /> : tabList[tab].component}
        </div>
      </section>
    </main>
  );
}

export default App;
