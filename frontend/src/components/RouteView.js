import react from "react";

const RouteStep = () => {
    return (<div>
        <span>Gallete Family Farms</span>
        <span>Loading</span>
        <span>Processed Food</span>
        <span>Distilled Spirits</span>
    </div>)
}

const RouteView = () => {


    return <div className="spatial-layout">
        <div className="rows">
            <div className="cols">
                <fieldset>
                    <legend>Current Route</legend>
                </fieldset>
                <div>
                    <RouteStep></RouteStep>
                    <RouteStep></RouteStep>
                    <RouteStep></RouteStep>
                    <RouteStep></RouteStep>
                    <RouteStep></RouteStep>
                    <RouteStep></RouteStep>
                </div>
                <button>Add Loading Step</button>
                <button>Add Clearing Step</button>
            </div>


        </div>
    </div>;

}

export default RouteView;