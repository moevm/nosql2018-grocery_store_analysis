const config = require("../config.json");
const mongoClient = require("mongodb").MongoClient;
const md5 = require('md5');

let collection;

mongoClient.connect(config.dbUrl, (err, client) => {
    const db = client.db("local");
    collection = db.collection(config.collection);
});

const auth = async function(login, password){
    return new Promise(resolve => {
        collection.findOne({"admin.login": login, "admin.pass": md5(password)}, {"key":1}).then(shop => {        
            resolve(shop ? shop["key"] : null);
        });
    });
};

const dbTool = async function(method, key, params){
    return new Promise((resolve, reject) => {
        switch (method) {
            case "main":
                getMainInfo(key).then(result => { resolve(result) });
                break;
        
            default:
                reject({ message: "Unknown api url: " + method, status: 404 });
                break;
        }
    });
};

const getMainInfo = async function(key){
    return new Promise(resolve => {
        collection.findOne({ "key": key }, { "admin": 1, "url": 1, "name": 1, "text": 1, "sessions": 1 }).then(shop => {        
            if(shop){
                resolve({
                    login: shop.admin.login,
                    url: shop.url,
                    name: shop.name,
                    text: shop.text,
                    users: shop.sessions.length
                });
            }else{
                resolve({});
            }
        });
    });
};

module.exports = {
    auth: auth, 
    dbTool: dbTool
}