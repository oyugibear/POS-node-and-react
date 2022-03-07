var app = require("express");
var server = require("http").Serve(app);
var bodyParser = require("body-parser");
var Datatore = require("nedb");
var async = require("async"); 

app.use(bodyParser.json());

module.exports = app;

//Creating the database
var inventoryDB = new Datatore({
    filename: "./server/databases/inventory.db",
    autoload: true
})

//Get inventory
app.get("/", function(req, res){
    res.send("Inverntory API")
});

//GET a product from the inventory DB
app.get("/product/:productId", function(req, res){
    if(!req.params.productId){
        res.status(500).send("ID field is required");
    }else{
        inventoryDB.findOne({_id: req.params.productId}, function(err, product){
            res.send(product);
        })
    }
})

//Get all inventory products 
app.get("/products", function(req, res){
    inventoryDB.find({}, function(err, docs){
        console.log("sending inventory products");
        res.send(docs);
    })
})

//create inventory product
app.post("/product", function(req, res){
    var newProduct = req.body;

    inventoryDB.insert(newProduct, function(err, product){
        if(err){
            res.status(500).send(err);
        }else{
            res.send(product);
        }
    })
})

//deleting product from inventory
app.delete("/product/:productId", function(req, res){
    inventoryDB.remove({_id: req.params.productId}, function(err, numRemoved){
        if(err){
            res.status(500).send(err);
        }else{
            res.sendStatus(200);
        }
    })
})

//update inventory product
app.put("/product", function(req, res){
    var productId = req.body._id;

    inventoryDB.update({_id: productId}, req.body, {}, function(err, numReplaced, product){
        if(err){
            res.status(500).send(err)
        }else{
            res.sendStatus(200);
        }
    })
})

//updates the products by decrementing them every time they are requested.
app.decrementInventory = function(products){
    async.eachSeries(products, function(transactionProduct, callback){
        inventoryDB.findOne({_id: transactionProduct._id}, function(err, product){
            //catch items that don't exist in the inveentory
            if(!product || !product.quantity_on_hand){
                callback();
            }else{
                var updatedQuantity =
                    parseInt(product.quantity_on_hand) -
                    parseInt(transactionProduct.quantity);

                inventoryDB.update(
                    {_id: product._id},
                    {$set: {quantity_on_hand: updatedQuantity}},
                    {},
                    callback
                )
            }
        })
    })
}