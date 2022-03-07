//this is the entry point for out point of sale system it is like the nervous system; all the routes pass through here
//websockets are bidirectional connections between clients and the server
/* Cross-origin resource sharing (CORS) is a mechanism that allows restricted resources (e.g. fonts) on a web page to 
be requested from another domain outside the domain from which the first resource was served. */


var express = require("express"),
    http = require("http")
    port = 80,
    app = require("express") (),
    server = http.createServer(app),
    bodyParser = require("body-parser"),
    io = require("socket.io") (server),
    liveCart = [];

console.log("POS is running");
console.log("Server started");
//the code below allows data to be sent to the database using http request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// allows node js to use commands between different domains (CORS)
app.all("*/", function(req, res, next){
    //Cors header
    res.header("Access-Control-Allow-Origin", "*"); //restricts the responses to the required domain
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS") // SET CUSTOM HEARDERS FOR CORS
    res.header("Access-Control-Allow-Headers", "Content-type, Accept, X-Access-Token, X-Key");
    if(req.method == "OPTIONS"){
        res.status(200).end();
    }else{
        next();
    }
})

//default route for node js
app.get("/", function(req, res){
    res.send("pos app is running");
});

//displays the routes for the inventory and transactions
app.use("/api/inventory", require("/api/inventory"));
app.use("/api", require("./api/transactions"));

//Web socket logic for the live cart
io.on("connection", function(socket){
    socket.on("cart-transaction-complete", function(){
        socket.broadcast.emit("update-live-cart-display", {});
    })
});

//on page load display users current cart
socket.on("live-cart-page-loaded", function(){
    socket.emit("update-live-cart-display", liveCart)
})

//on page load, make client update cart
socket.emit("update-live-cart-display", liveCart);

//when the cart is updated by POS it keeps track of all the data
socket.on("update-live-cart", function(cartData){
    //the code below keeps track of the selected items
    liveCart = cartData;
    //broadcast the data to all websocket clients
    socket.emit("update-live-cart-display", liveCart);
})

server.listen(port, () => console.log(`listening on port ${port}`))

