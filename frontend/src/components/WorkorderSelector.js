import React, { useEffect, useState } from "react";
import classNames from 'classnames';

export default function WorkorderSelector({ onChange, workorder, onReady }) {

    const [workorders, setWorkorders] = useState([]);

    const [selectedWorkorder, setSelectedWorkorder] = useState({});

    const updateSelection = (workorder) => {
        if (workorder.workorder === selectedWorkorder.workorder) {
            setSelectedWorkorder({});
            onChange?.(null);
        } else {
            setSelectedWorkorder(workorder);
             onChange?.(workorder);
        }
        
    }

    useEffect(() => {

        const fetchData = async () => {
            const resolvedWorkorders = await fetch('/api/workorder', { headers: { 'Content-Type': 'application/json' } }).then(res => res.json());
            setWorkorders(resolvedWorkorders);
            onReady?.(resolvedWorkorders);
        }

        fetchData();

    }, [workorder])

    useEffect(() => {

        const fetchData = async () => {
            const resolvedWorkorders = await fetch('/api/workorder', { headers: { 'Content-Type': 'application/json' } }).then(res => res.json());
            setWorkorders(resolvedWorkorders);
            onReady?.(resolvedWorkorders);
        }

        fetchData();

    }, [])

    return <ul className="workorder-list">
        {workorders.map((workorder, index) => <li key={workorder.workorder} className={classNames("workorder", { "active": selectedWorkorder?.workorder === workorder.workorder })} onClick={() => updateSelection(workorder)}>
            <span className="workorder__title">Workorder {index + 1} &mdash;
                {Math.ceil((workorder.ores.reduce((bag, o) => bag += parseInt(o.volume), 0))/100)} SCU
            </span><div className="pills">{workorder.ores.map(ore => <span key={workorder.workorder + ore.code} className="namedPill" title={ore.code}>{ore.volume}</span>)}</div></li>)}
    </ul>

}