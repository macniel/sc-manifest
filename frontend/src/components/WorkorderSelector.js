import React, { useEffect, useState } from "react";
import classNames from 'classnames';
import { ReactComponent as ClockIcon } from '../assets/ui-clock.svg';

export default function WorkorderSelector({ onChange, workorder, onReady, onUpdate }) {

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

    }, [workorder, onReady])

    const getTimeRemaining = (time) => {
        const now = Date.now();
        const timeFromNow = time - now;
        if (timeFromNow > 0) {
            let seconds = Math.floor(timeFromNow / 1000);
            let minutes = Math.floor(timeFromNow / (60 * 1000));
            let hours = Math.floor(timeFromNow / (60 * 60 * 1000));
            let days = Math.floor(timeFromNow / (24 * 60 * 60 * 1000));
    
            let actualHours = hours - (days * 24);
            let actualMinutes = minutes - (hours * 60);
            let actualSeconds = seconds - (minutes * 60);
        
            let parsedString = '';
            if (days) parsedString += `${days || 0}d `;
            if (actualHours) parsedString += `${actualHours || 0}h `;
            if (actualMinutes) parsedString += `${actualMinutes || 0}m `
            if (actualSeconds) parsedString += `${actualSeconds || 0}s `;
            return parsedString;
        } else {
            return null;
        }
    }

    useEffect(() => {
        let INTERVAL = 1000;
        const intervalId = setInterval(() => {
            const wo = workorders.map(wo => {
                if (wo.timeWhen) {
                    wo.timeRemaining = getTimeRemaining(wo.timeWhen)
                }
                return wo;
            });
            setWorkorders(wo);
            onUpdate?.(wo);
        }, INTERVAL);
        return () => {
            clearInterval(intervalId);
        }
    }, [workorders, onUpdate])

    useEffect(() => {

        const fetchData = async () => {
            const resolvedWorkorders = await fetch('/api/workorder', { headers: { 'Content-Type': 'application/json' } }).then(res => res.json());
            setWorkorders(resolvedWorkorders);
            onReady?.(resolvedWorkorders);
        }

        fetchData();

    }, [onReady])

    return <ul className="workorder-list">
        {workorders.map((workorder, index) => <li key={workorder.workorder} className={classNames("workorder", { "active": selectedWorkorder?.workorder === workorder.workorder })} onClick={() => updateSelection(workorder)}>
            <span className="workorder__title">Workorder {index + 1}
            <span className="status-element status-right">{workorder.timeRemaining || 'ready'} <ClockIcon /></span>
            </span><div className="pills">{workorder.ores.map(ore => <span key={workorder.workorder + ore.code} className="namedPill" title={ore.code}>{ore.volume}</span>)}</div></li>)}
    </ul>

}