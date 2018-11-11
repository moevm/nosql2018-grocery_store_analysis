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
    auth(req.body.login, req.body.pass).then(data => {
        if(data){
            const sessionId = Math.random().toString(36).substring(3);

            sessions[sessionId] = data.key;
            res.cookie('session', sessionId, { maxAge: 900000 });
            res.cookie('name', data.name, { maxAge: 900000 });

            res.redirect('/');
        }else{
            res.redirect('/?bad-auth=1');
        }

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
            name: req.cookies.name
        });
    }else{
        res.render("login");
    }
});


app.get('/logout', (req, res) => {
    const reqSession = req.cookies.session;

    if(reqSession && sessions[reqSession]){
        delete sessions[reqSession];
    }

    res.redirect('/');
});

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`);
})