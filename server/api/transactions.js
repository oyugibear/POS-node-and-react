var app = require("express") ()
var server = require("http").Server(app)
var bodyParser = require("body-parser")
const { truncate } = require("fs")
var DataStore = require('nedb')

var Inventory = require('./inventory')

app.use(bodyParser.json())

module.exports = app

//creating the database
var Transactions = new DataStore({
    filename: './server/databases/transactions.db',
    autoload: true
})

app.get('/', function(req, res){
    res.send('Transactions API')
})

// get all transactions
app.get('/', function(req, res){
    Transactions.find({}, function(err, docs){
        res.send(docs);
    })
})

// get all transactions p2
app.get('/limit', function(req, res){
    var limit = parseInt(req.query.limit, 10)
    if(!limit){
        limit = 5
    }
    Transactions.find({}).limit(limit).sort({date: -1}).exec(function(err, docs){
        res.send(docs);
    })
})

//get total sales for the day
app.get('/day-total', function(req, res){
    //if the date is provided
    if(req.query.date){
        startDate = new Date(req.query.date)
        startDate.setHours(0,0,0,0)

        endDate = new Date(req.query.date)
        endDate.setHours(23,59,59,999)   
    }else{
        //sets it to the begining of the current day
        var startDate = new Date()
        startDate.setHours(0,0,0,0)

        //end of the current day
        var endDate = new Date()
        endDate.setHours(23,59,59,999)

        Transactions.find({date: {$gte: startDate.toJSON(), $lte: endDate.toJSON()}}, function(err, docs){
            var result = {
                date: startDate
            }
            if(docs){
                var total = docs.reduce(function(p, c){
                    return p + c.total;
                }, 0.00)

                result.total = parseFloat(parseFloat(total).toFixed(2))

                res.send(result)
            } else {
                result.total = 0
                res.send(result)
            }
        })
    }
})

//get transactions for a particular date
app.get('/by-date', function(req, res){
    var startDate = new Date(2018, 2, 21)
    startDate.setHours(0,0,0,0)

    var endDate = new Date(2015, 2, 21)
    endDate.setHours(23,59,59,999)

    Transactions.find({date: {$gte: startDate.toJSON(), $lte: endDate.toJSON}}, function(err, docs){
        if(docs){
            res.send(docs);
        }
    })
})

//Add new transactions
app.post('/new', function(req, res){
    var newTransaction = req.body

    Transactions.insert(newTransaction, function(err, transaction){
        if(err){
            res.status(500).send(err)
        }else{
            res.sendStatus(200)
            Inventory.decrementInventory(transaction.products)
        }
    })
})

//get single transaction
app.get('./:transactionId', function(req, res){
    Transactions.find({_id: req.params.transactionId}, function(err, doc){
        if(doc){
            res.send(doc[0])
        }
    })
})