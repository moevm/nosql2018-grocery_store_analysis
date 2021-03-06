const config = require("../config.json");
const mongoClient = require("mongodb").MongoClient;
const md5 = require('md5');

const shops = [];
let collection;

mongoClient.connect(config.dbUrl, (err, client) => {
    const db = client.db("local");
    collection = db.collection(config.collection);
    
    db.collection(config.collection).find().forEach(item => {
        if(item == null) {
            db.close();
            return;
        }

        shops.push(item);
    }).then(() => {
        console.log("[DB] Shops loaded");
    });
});

const auth = async function(login, password){
    return new Promise(resolve => {
        const shop = shops.find(s => (
            s.admin.login === login && s.admin.pass === md5(password)
        ));

        if (shop) {
            resolve({
                name: shop.admin.login,
                key: shop.key
            });
        } else {
            resolve(false);
        }
    });
};

const dbImport = async function (doc) {
    return new Promise(resolve => {
        collection.insertOne(doc, function (err, res) {
            if (err) throw err;

            shops.push(doc);

            console.log("[DB] 1 document inserted");
            resolve();
        });
    });
};

const dbExport = async function (key) {
    return new Promise(resolve => {
        resolve( shops.find(s => s.key === key ) || {} );
    });
};

const dbTool = async function(method, key, params){
    return new Promise((resolve, reject) => {
        switch (method) {
            case "main":
                getMainInfo(key).then(result => { resolve(result) });
                break;
            case "traffic":
                getTraffic(key, params.from, params.to).then(result => { resolve(result) });
                break;
            case "conversion":
                getConversion(key, params.from, params.to).then(result => { resolve(result) });
                break;
            case "revenue":
                getRevenue(key, params.from, params.to).then(result => { resolve(result) });
                break;
            case "acost":
                getAverageCostOfGoods(key, params.from, params.to).then(result => { resolve(result) });
                break;
            case "arevenue":
                getAverageRevenuePerUser(key, params.from, params.to).then(result => { resolve(result) });
                break;
            case "apay":
                getAverageRevenuePerPayingUser(key, params.from, params.to).then(result => { resolve(result) });
                break;

            case "users":
                getUsers(key).then(result => { resolve(result) });
                break;
                
            case "orders":
                getOrders(key, params.from, params.to).then(result => { resolve(result) });
                break;
        
            default:
                reject({ message: "Unknown api url: " + method, status: 404 });
                break;
        }
    });
};

const getMainInfo = async function(key){
    return new Promise(resolve => {
        const shop = shops.find(s => (
            s.key === key
        ));

        if (shop) {
            resolve({
                login: shop.admin.login,
                url: shop.url,
                name: shop.name,
                text: shop.text,
                users: shop.sessions.length
            });
        } else {
            resolve({});
        }
    });
};

const getTraffic = async function (key, from, to) { 
    return new Promise(resolve => {
        const shop = shops.find(s => (
            s.key === key
        ));

        if (shop && from && to) {
            const fromFilter = new Date(from).getTime();
            const toFilter = new Date(to).getTime() + 23*59*59*1000;

            const sessions = {};
            
            shop.sessions.filter(session => (
                new Date(session['session_start']).getTime() > fromFilter && new Date(session['session_end']).getTime() < toFilter
            )).forEach(session => {
                const currDate = new Date(session['session_end']);
                const strDate = ("0" + (currDate.getUTCMonth() + 1).toString()).slice(-2) + "." + ("0" + currDate.getUTCDate().toString()).slice(-2);

                if(!sessions[strDate]){
                    sessions[strDate] = 1
                }else{
                    sessions[strDate] = sessions[strDate] + 1
                }
            });

            resolve(sessions);
        } else {
            resolve({});
        }
    });
};

const getConversion = async function (key, from, to) { 
    return new Promise(resolve => {
        const shop = shops.find(s => (
            s.key === key
        ));

        if (shop && from && to) {
            const fromFilter = new Date(from).getTime();
            const toFilter = new Date(to).getTime() + 23*59*59*1000;

            let out = 0, target = 0, buy = 0;
            
            shop.sessions.filter(session => (
                new Date(session['session_start']).getTime() > fromFilter && new Date(session['session_end']).getTime() < toFilter
            )).forEach(session => {
                session.targets.forEach(t => {
                    if(t.type === "Изменение корзины"){
                        target++
                    }else if(t.type === "Покупка"){
                        buy++
                    }else{
                        out++
                    }
                });
            });

            resolve([
                { name: 'Ушли', y: Math.round(out / (out + target + buy) * 100) },
                { name: 'Достигли цель', y: Math.round(target / (out + target + buy) * 100) },
                { name: 'Купили', y: Math.round(buy / (out + target + buy) * 100) }
            ]);
        } else {
            resolve({});
        }
    });
};

const getRevenue = async function (key, from, to) { 
    return new Promise(resolve => {
        const shop = shops.find(s => (
            s.key === key
        ));

        if (shop && from && to) {
            const fromFilter = new Date(from).getTime();
            const toFilter = new Date(to).getTime() + 23*59*59*1000;

            const offers = shop.offers;
            const sessions = {};
            
            shop.sessions.filter(session => (
                new Date(session['session_start']).getTime() > fromFilter && new Date(session['session_end']).getTime() < toFilter
            )).forEach(session => {
                let price = 0;

                session.targets.forEach(t => {
                    if(t.type === "Покупка"){
                        t.offers.forEach(o => {
                            price += parseInt(offers.find(offer => offer.id == o).price)
                        });
                    }
                });

                const currDate = new Date(session['session_end']);
                const strDate = ("0" + (currDate.getUTCMonth() + 1).toString()).slice(-2) + "." + ("0" + currDate.getUTCDate().toString()).slice(-2);

                if(!sessions[strDate]){
                    sessions[strDate] = price
                }else{
                    sessions[strDate] = sessions[strDate] + price
                }
            });

            resolve(sessions);
        } else {
            resolve({});
        }
    });
};

const getAverageCostOfGoods = async function (key, from, to) { 
    return new Promise(resolve => {
        const shop = shops.find(s => (
            s.key === key
        ));

        if (shop && from && to) {
            const fromFilter = new Date(from).getTime();
            const toFilter = new Date(to).getTime() + 23*59*59*1000;

            const offers = shop.offers;
            const sessions = {};
            
            shop.sessions.filter(session => (
                new Date(session['session_start']).getTime() > fromFilter && new Date(session['session_end']).getTime() < toFilter
            )).forEach(session => {
                let cost = 0, goodsCount = 0;

                session.targets.forEach(t => {
                    if(t.type === "Покупка"){
                        t.offers.forEach(o => {
                            cost += parseInt(offers.find(offer => offer.id == o).price)
                        });

                        goodsCount += t.offers.length;
                    }
                });

                const aCost = (cost != 0 && goodsCount != 0) ? (cost / goodsCount) : 0;

                const currDate = new Date(session['session_end']);
                const strDate = ("0" + (currDate.getUTCMonth() + 1).toString()).slice(-2) + "." + ("0" + currDate.getUTCDate().toString()).slice(-2);

                if(!sessions[strDate]){
                    sessions[strDate] = aCost;
                }else{
                    if(aCost != 0) sessions[strDate] = (sessions[strDate] + aCost)/2
                }
            });

            resolve(sessions);
        } else {
            resolve({});
        }
    });
};

const getAverageRevenuePerUser = async function (key, from, to) { 
    return new Promise(resolve => {
        const shop = shops.find(s => (
            s.key === key
        ));

        if (shop && from && to) {
            const fromFilter = new Date(from).getTime();
            const toFilter = new Date(to).getTime() + 23*59*59*1000;

            const offers = shop.offers;
            const periods = {};
            
            shop.sessions.filter(session => (
                new Date(session['session_start']).getTime() > fromFilter && new Date(session['session_end']).getTime() < toFilter
            )).forEach((session, i, arr) => {
                const currDate = new Date(session['session_end']);
                const strDate = ("0" + (currDate.getUTCMonth() + 1).toString()).slice(-2) + "." + ("0" + currDate.getUTCDate().toString()).slice(-2);

                if(!periods[strDate]){
                    periods[strDate] = {}
                }

                session.targets.forEach(t => {
                    if(t.type === "Покупка"){
                        let price = 0;

                        t.offers.forEach(o => {
                            price += parseInt(offers.find(offer => offer.id == o).price)
                        });

                        if(!periods[strDate][session.uid]){
                            periods[strDate][session.uid] = price
                        }else{
                            periods[strDate][session.uid] = periods[strDate][session.uid] + price
                        }
                    }
                });
            });

            const result = {};
            
            Object.keys(periods).forEach(p => {
                result[p] = Object.values(periods[p]).reduce((sum, curr) => sum + curr) / Object.keys(periods[p]).length;
            });

            resolve(result);
        } else {
            resolve({});
        }
    });
};

const getAverageRevenuePerPayingUser = async function (key, from, to) { 
    return new Promise(resolve => {
        const shop = shops.find(s => (
            s.key === key
        ));

        if (shop && from && to) {
            const fromFilter = new Date(from).getTime();
            const toFilter = new Date(to).getTime() + 23*59*59*1000;

            const offers = shop.offers;
            const periods = {};
            
            shop.sessions.filter(session => (
                new Date(session['session_start']).getTime() > fromFilter && new Date(session['session_end']).getTime() < toFilter
            )).forEach(session => {
                let cost = 0, goodsCount = 0;

                session.targets.forEach(t => {
                    if(t.type === "Покупка"){
                        t.offers.forEach(o => {
                            cost += parseInt(offers.find(offer => offer.id == o).price)
                        });

                        goodsCount += t.offers.length;
                    }
                });

                const currDate = new Date(session['session_end']);
                const strDate = ("0" + (currDate.getUTCMonth() + 1).toString()).slice(-2) + "." + ("0" + currDate.getUTCDate().toString()).slice(-2);

                if(!periods[strDate]){
                    periods[strDate] = {
                        cost,
                        goodsCount
                    }
                }else{
                    periods[strDate].cost += cost;
                    periods[strDate].goodsCount += goodsCount;
                }
            });

            const result = {};

            Object.keys(periods).forEach(p => {
                result[p] = periods[p].cost / periods[p].goodsCount
            });
            
            resolve(result);
        } else {
            resolve({});
        }
    });
};

const getUsers = async function (key) {
    return new Promise(resolve => {
        const shop = shops.find(s => (
            s.key === key
        ));

        const users = [];
        shop.sessions.forEach(session => {
            const uid = session.uid;
            const userIndex = users.findIndex(u => u.uid === uid);

            if( userIndex !== -1 ){
                users[userIndex].visits += session.targets.length;
                users[userIndex].revenue += session.targets.filter(t => t.type === "Покупка").length;
                users[userIndex].offers += session.targets.filter(t => t.type === "Покупка").reduce((a, b) => (a.offers ? a.offers.length : 0) + (b.offers ? b.offers.length : 0), 0);
                if (!users[userIndex].contacts ) {
                    users[userIndex].contacts = [];
                }

                session.targets.filter(t => t.type === "Покупка").forEach(t => users[userIndex].contacts.push(t.delivery.email));
            } else {
                users.push({
                    uid: session.uid,
                    visits: session.targets.length,
                    revenue: session.targets.filter(t => t.type === "Покупка").length,
                    offers: session.targets.filter(t => t.type === "Покупка").reduce((a, b) => (a.offers ? a.offers.length : 0) + (b.offers ? b.offers.length : 0), 0),
                    contacts: session.targets.filter(t => t.type === "Покупка").map(t => t.delivery.email)
                });
            }
        });

        resolve(users);
    });
}

const getOrders = async function (key, from, to) {
    return new Promise(resolve => {
        const shop = shops.find(s => (
            s.key === key
        ));

        if (shop && from && to) {
            const fromFilter = new Date(from).getTime();
            const toFilter = new Date(to).getTime() + 23*59*59*1000;

            const offers = shop.offers;
            const orders = [];
            
            shop.sessions.filter(session => (
                new Date(session['session_start']).getTime() > fromFilter && new Date(session['session_end']).getTime() < toFilter
            )).forEach(session => {
                session.targets.filter(t => t.type === "Покупка").forEach(target => {
                    let check = 0;
                    offers.filter(o => target.offers.indexOf(o.id) !== -1).forEach(o => {
                        check += parseInt(o.price);
                    });

                    orders.push({
                        date: new Date(target.date).toLocaleString(),
                        uid: session.uid,
                        offers: offers.filter(o => target.offers.indexOf(o.id) !== -1).map(o => o.name),
                        check
                    });
                });
            });

            resolve(orders);
        } else {
            resolve([]);
        }
    });
}

module.exports = { auth, dbTool, dbImport, dbExport }