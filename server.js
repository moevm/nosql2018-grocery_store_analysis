const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");

const port = 8080;
const {auth, dbTool} = require("./libs/dbLib");

const sessions = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/public", express.static(__dirname + "/views/public"));
app.set("view engine", "ejs");

app.post("/auth", (req, res) => {
    auth(req.body.login, req.body.pass).then(key => {
        if(key){
            const sessionId = Math.random().toString(36).substring(3);

            sessions[sessionId] = key;
            res.cookie('session', sessionId, { maxAge: 900000 });
        }

        res.redirect('/');
    });
});

app.get('/api/:method', (req, res) => {
    const reqSession = req.cookies.session;

    if(reqSession && sessions[reqSession]){
        dbTool(req.params.method, sessions[reqSession], req.query).then(result => {
            res.json(result);
        }).catch(err => {
            console.error(err.message);

            res.sendStatus(err.status);
        });
    }else{
        res.sendStatus(403);
    }
});

app.get('/', (req, res) => {
    const reqSession = req.cookies.session;

    if(reqSession && sessions[reqSession]){
        res.render("main", {
            title: "ShopStats",
            text: "Welcome!"
        });
    }else{
        res.render("login");
    }
});

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`);
})