import { ReactComponent as Logo } from "../logo.svg";

function WelcomeScreen() {
  const trelloBoard = "https://trello.com/b/jqy54pmb/sc-manifest";
  const github = "https://www.github.com/macniel/sc-manifest";

  const clear = () => {
    localStorage.removeItem("manifests");
    localStorage.removeItem("logs");
    // eslint-disable-next-line no-restricted-globals
    location.reload();
  };

  return (
    <>
      <div>
        <Logo />
        <h1>Shipping Solutions Ltd.</h1>
      </div>
      <div>
        <p>Never misplace a Shipping Manifest</p>
        <p
          style={{ padding: "40px", marginTop: "80px", marginBottom: "120px" }}
        >
          Touch tabs to start
        </p>
      </div>
      <div>
        <h2>Stay informed</h2>
        <p>
          This Application is in active development, check out its progress on
          <a href={trelloBoard}>Trello</a> and <a href={github}>Github</a>
        </p>
      </div>
      <div>
        <h2>Problems?</h2>
        <p>Try deleting your localStorage</p>

        <button onClick={() => clear()}>Clear LocalStorage</button>
      </div>
    </>
  );
}

export default WelcomeScreen;
