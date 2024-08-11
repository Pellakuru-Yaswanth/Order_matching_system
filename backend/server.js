const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const mysql = require('mysql');
const cors = require('cors');

var count = 0;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "b9pcaxfclgc85jzooqcq-mysql.services.clever-cloud.com",
    user: "ukosgmp6unqv2keo",
    password: "xVWx9Pz6LtXKbduFfWhi",
    database: "b9pcaxfclgc85jzooqcq"
});

db.connect(err => {
    if(err) {
        console.log("Could not connect to MySQL", err);
        process.exit(1);
    }
    console.log("Connected to MySQL");
})

io.on('connection', (socket) => {
    console.log("A User Connected.."+count);
    count++;
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
})

app.get('/getpdata', (req,res) => {
    db.query("select * from POT", (err,data) => {
        if(err) console.log(err);
        else {
            var b = [];
            var s = [];
            for(let i of data){
                if(i.seller_price!==null) s.push(i);
                else b.push(i)
            }
            return res.json([b,s]);
        }
    })
});

app.get('/getcdata', (req, res) => {
    db.query("select * from COT", (err, data) => {
        if(err) console.log(err);
        else return res.json(data);
    })
})

app.get('/getMaxId', (req, res) => {
    if(req.body.maxo === "porders"){
        db.query("select max(id) as max_id from POT", (err,data) => {
            if(err) return res.json(false);
            if(data.length>0) return res.json(data[0].max_id+1);
            else return res.json(1001);
        })
    }
    else{
        db.query("select max(id) as max_id from COT", (err,data) => {
            if(err) return res.json(false);
            if(data.length>0) return res.json(data[0].max_id+1);
            else return res.json(101);
        })
    }
})

app.post('/postdata',(req,res) => {
    console.log("POsted data..")
    let {type, cid, id, price, qty} = req.body;
    if(type==='sell'){
        db.query("select * from POT where buyer_price >= ?", [price], (err, data) => {
            if(err){
                console.log("Terminated-1");
            }
            if(data.length>0){
                data = data.sort((a,b) => b.buyer_price-a.buyer_price);
                let newQty = qty
                for(let i of data){
                    if(newQty>=i.buyer_qty){
                        db.query("delete from POT where id=?", [i.id], (err, data) => {
                            if(err) console.log("Terminated-2")
                            else console.log("Duplicate deleted successfully!")
                        });
                        newQty = newQty-i.buyer_qty;
                        if(newQty===0) break;
                    }
                    else{
                        db.query("update POT set buyer_qty=? where id=?", [i.buyer_qty-newQty, i.id], (err,data) => {
                            if(err) console.log("Terminated-3");
                            else console.log("Updated successfully-1")
                        })
                        newQty = 0;
                        break;
                    }
                }
                if(newQty>0){
                    console.log(qty);
                    db.query("insert into POT(id, seller_price, seller_qty) values(?, ?, ?)", [id, price, newQty] ,(err, data) => {
                        if(err) console.log("Terminated-4");
                        else console.log("Updated successfully-2")
                    })
                }
                db.query("insert into COT(id,price,qty) values(?, ?, ?)", [cid, price, qty-newQty], (err, data) => {
                    if(err) console.log("Terminated-5");
                    else{
                        console.log("Order completed");
                    }
                })
            }
            else{
                db.query("insert into POT(id, seller_price, seller_qty) values(?, ?, ?)", [id, price, qty] ,(err, data) => {
                    if(err) console.log("Terminated-5");
                    else console.log("Updated successfully-3")
                })
            }
        })
    }
    else {
        db.query("select * from POT where seller_price <= ?", [price], (err, data) => {
            if(err){
                console.log("Terminated-1");
            }
            if(data.length>0){
                console.log(data);
                data = data.sort((a,b) => a.seller_price-b.seller_price);
                let newQty = qty
                for(let i of data){
                    if(newQty>=i.seller_qty){
                        db.query("delete from POT where id=?", [i.id], (err, data) => {
                            if(err) console.log("Terminated-2")
                            else console.log("Duplicate deleted successfully!")
                        });
                        newQty = newQty-i.seller_qty;
                        if(newQty===0) break;
                    }
                    else{
                        db.query("update POT set seller_qty=? where id=?", [i.seller_qty-newQty, i.id], (err,data) => {
                            if(err) console.log("Terminated-3");
                            else console.log("Updated successfully-1")
                        })
                        newQty = 0
                        break;
                    }
                }
                if(newQty>0){
                    console.log(newQty);
                    db.query("insert into POT(id, buyer_price, buyer_qty) values(?, ?, ?)", [id, price, newQty] ,(err, data) => {
                        if(err) console.log("Terminated-4");
                        else console.log("Updated successfully-2")
                    })
                }
                db.query("insert into COT(id, price, qty) values(?, ?, ?)", [cid, price, qty-newQty], (err, data) => {
                    if(err) console.log("Terminated-5");
                    else{
                        console.log("Order completed");
                    }
                })
            }
            else{
                db.query("insert into POT(id, buyer_price, buyer_qty) values(?, ?, ?)", [id, price, qty] ,(err, data) => {
                    if(err) console.log("Terminated-5");
                    else console.log("Updated successfully-3")
                })
            }
        })
    }
    io.emit('activate');
})

server.listen(3001, () => {
    console.log("Listening at port 3001...")
})