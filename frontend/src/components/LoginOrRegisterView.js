import classNames from "classnames";
import React, { useState, useEffect } from "react";

function LoginOrRegisterView({onLoginStateChange}) {

    const [mode, setMode] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');
    const [username, setUsername] = useState('');
    const [passwordInvalid, setPasswordInvalid] = useState(false);
    const [passwordRepeatInvalid, setPasswordRepeatInvalid] = useState(false);
   
    const loginOrRegister = () => {
        console.log('called', username, password, passwordRepeat, passwordInvalid, mode && passwordRepeatInvalid);
        if (passwordInvalid) return false;
        if (mode && passwordRepeatInvalid) return false;
        if (mode) { // register
            fetch('/api/register', {
                  headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
                method: 'post',
            }).then(res => res.json()).then(({username}) => {
                console.log(username);
                onLoginStateChange?.(username);
            }).catch(error => {
                onLoginStateChange?.(false);
            });
        } else { // login
            fetch('/api/login', {
                 headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
                method: 'post',
            }).then(res => res.json()).then(({username}) => {
                console.log(username);
                onLoginStateChange?.(username);
            }).catch(error => {
                onLoginStateChange?.(false);
            });
        }
    }

    const updatePassword = (newValue) => {
        setPassword(newValue);
        console.log(newValue, passwordRepeat);
        if (mode && (newValue === '' || newValue !== passwordRepeat)) {
            setPasswordInvalid(true);
        } else if (newValue === '') {
            setPasswordInvalid(true);
        } else {
            setPasswordInvalid(false);
            setPasswordRepeatInvalid(false);
        }
    }
    
    const updatePasswordRepeat = (newValue) => {
        setPasswordRepeat(newValue);
        if (mode && (newValue === '' || newValue !== password)) {
            setPasswordRepeatInvalid(true);
        } else {
            setPasswordRepeatInvalid(false);
            setPasswordInvalid(false);
        }
    }

    useEffect( () => {
        console.log('mode', mode);
    }, [mode])

    useEffect(() => {
        updatePassword(password);
        updatePasswordRepeat(passwordRepeat);
    }, []);


    return (
        <fieldset className="login-form">
            <legend style={{height: "5px"}}></legend>
            <div>
                <label><span>Username</span><input name="username" onChange={(event) => setUsername(event?.target?.value)} value={username} /></label></div>
            <div className={passwordInvalid ? 'invalid' : ''}>
                <label><span>Password</span><input name="password" onChange={(event) => updatePassword(event?.target?.value)} type="password" value={password} /></label></div>
            <div>
                <label><input type="checkbox" onChange={() => setMode(!mode)} defaultChecked={mode} /><span>Register new account</span></label></div>
            {mode ? <div><label><span>Repeat your password</span><input name="passwordrepeat" onChange={(event) => updatePasswordRepeat(event?.target?.value)} value={passwordRepeat} type="password" disabled={!mode} /></label></div> : <div />}
                <div>
            <button className="button button--primary" onClick={() => loginOrRegister()} >{mode ? 'Register' : 'Login'}</button>
            </div>
            
        </fieldset>);
}

export default LoginOrRegisterView;