const express = require("express");
const express_ws = require("express-ws");
const fs = require("fs");
const port_no = 8080;
const path = require("path");
const data = require("./static/datamanage");

const Bucket = new data.DataPersist(new data.RuntimeStorage({
}));

var app = express();
express_ws(app);

app.use("/static",express.static(path.join(__dirname, 'static')));

app.ws("/api",function(ws,req) {
  console.log("Opened websocket.");
  new data.SocketConnection(ws,req,Bucket);
});

app.get("/",function(req,res){
  res.redirect("/static/index.html");
});

app.listen(port_no,function(){

});
