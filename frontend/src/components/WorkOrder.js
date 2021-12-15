import React, { useState, useEffect } from "react";

function WorkOrder() {
  return (
    <div>
      <div className="refinement-process">
        <div className="refinement-process__unrefined-material"></div>
        <span className="arrow-down"></span>
        <div className="refinement-process__refined-material"></div>
      </div>
    </div>
  );
}

export default WorkOrder;
