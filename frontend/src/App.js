import "./App.css";
import WelcomeScreen from "./WelcomeScreen";
import { useState, useEffect } from "react";

function App() {
  const [tab, setTab] = useState(0);
  const [tabList, setTabList] = useState([
    { name: "fleet", component: <WelcomeScreen /> },
    { name: "commodity", component: <div>Hello Commodity</div> },
    { name: "current", manifest: "0", component: <div>Manifest View</div> },
    { name: "log", component: <div>Log</div> },
  ]);
  console.log(tab, tabList);

  useEffect(() => {
    localStorage.getItem("manifests");
    fetch("/ships")
      .then((response) => response.json())
      .then(console.log);
  }, []);

  return (
    <div>
      <ul>
        {tabList.map((tabItem, index) => {
          return (
            <li
              key={`${tabItem.name}${
                tabItem.manifest ? "-" + tabItem.manifest : ""
              }`}
              className={tab === index ? "active" : ""}
              onClick={() => {
                setTab(index);
              }}
            >
              {tabItem.name}
            </li>
          );
        })}
      </ul>
      <WelcomeScreen />
    </div>
  );
}

export default App;
