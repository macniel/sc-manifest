import { Request, Response, NextFunction } from "express";
import { UserData } from "./types";

export const router = require('express').Router();
const { readFileSync, writeFileSync, existsSync, exists } = require("fs");
const { join } = require("path");
const guid = require("guid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

export const authenticateToken = (req: any, res: any, next: NextFunction) => {
    
    const token = req.cookies.auth;
    if (token == null) return res.sendStatus(401)
    jwt.verify(token, process.env.TOKEN_SECRET, (err: any, user: UserData) => {
        if (err) return res.sendStatus(403)

        // check if user exists in database
        let users = JSON.parse(readFileSync(join("data", "users.json"), "utf-8"));

        const userObject = users.find( (u:UserData) => u.username === user.username && u.userid === user.userid);

        if (!userObject) {
            return res.sendStatus(404);
        }
        req.user = userObject
        next()
    })
}

router.post("/login", (req: any, res: any) => {
    if (!req.body.username) return res.sendStatus(401);
    if (!req.body.password) return res.sendStatus(401);
    let users = JSON.parse(readFileSync(join("data", "users.json"), "utf-8"));
    const userObject = users.find( (u:UserData) => u.username === req.body.username && bcrypt.compareSync(req.body.password, u.hashedPassword));
    if (!userObject) return res.sendStatus(401);
    const token = jwt.sign({ username: userObject.username, userid: userObject.userid }, process.env.TOKEN_SECRET, { expiresIn: '1 day' })
    res.cookie("auth", token, { httpOnly: true });
    res.json({ "username": userObject.username });
})

router.post("/register", (req: any, res: any) => {
    if (!req.body.username) return res.sendStatus(400);
    if (!req.body.password) return res.sendStatus(400);
    const uuid = guid.raw();

    let users = JSON.parse(readFileSync(join("data", "users.json"), "utf-8"));
    const userObject = users.find( (u:UserData) => u.username === req.body.username);
    if (userObject) return res.sendStatus(403);
    users.push({
        username: req.body.username,
        userid: uuid,
        hashedPassword: bcrypt.hashSync(req.body.password, 10)
    });
    writeFileSync(join("data", "users.json"), JSON.stringify(users), "utf-8");

    const token = jwt.sign({ username: req.body.username, userid: uuid }, process.env.TOKEN_SECRET, { expiresIn: '1 day' })
    res.cookie("auth", token, { httpOnly: true });
    res.json({username: req.body.username});
})

router.get("/logout", (_:any, res: any) => {
    res.clearCookie("auth").sendStatus(200);
})

router.get("/verify", authenticateToken, (req :any, res:any) => {
    if (req.user) {
        res.json({ username: req.user.username }).status(200);
    } else {
        res.sendStatus(401);
    }
})
