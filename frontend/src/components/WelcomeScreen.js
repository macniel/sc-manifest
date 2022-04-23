import { useEffect, useState } from "react";
import { ReactComponent as Logo } from "../logo.svg";
import LoginOrRegisterView from "./LoginOrRegisterView";
import "./WelcomeScreen.css";

function WelcomeScreen({onLoginStateChange}) {
  const trelloBoard = "https://trello.com/b/jqy54pmb/sc-manifest";
  const github = "https://www.github.com/macniel/sc-manifest";

  const logout = () => {
    fetch('/api/logout').then((state) => {
      // eslint-disable-next-line no-restricted-globals
      setLoggedIn(false);
    })
  }

  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    onLoginStateChange?.(loggedIn);
  }, [loggedIn, onLoginStateChange]);

  
  useEffect(() => {
    fetch('/api/verify').then((res) => res.json()).then(({ username }) => {
      setLoggedIn(username)
    }
    ).catch((error) => {
      setLoggedIn(false)
    }
    );
  }, []);

  return (
    <div className="welcome-screen">
      <div>
        <Logo width="240px" height="240px" />
        <h1>Shipping Solutions Ltd.</h1>
      </div>
      <div>
        <p>Never misplace a Shipping Manifest</p>
        <div
          style={{ padding: "40px", marginTop: "20px", marginBottom: "20px" }}
        >
          {!loggedIn ? <LoginOrRegisterView onLoginStateChange={(username) => { setLoggedIn(username) }} /> : <fieldset><legend style={{ height: "5px" }}></legend>logged in as {loggedIn}<br /><button className="button--link" onClick={logout}>Click to Logout</button></fieldset>}
        </div>
      </div>
      <div>
        <h2>Stay informed</h2>
        <p>
          This Application is in active development, check out its progress on{" "}
          <a href={trelloBoard}>Trello</a> and <a href={github}>Github</a>
        </p>
      </div>
    </div>
  );
}

export default WelcomeScreen;
