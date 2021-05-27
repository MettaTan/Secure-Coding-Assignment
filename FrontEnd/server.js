const express=require('express');
const serveStatic=require('serve-static');
var fs = require('fs')
var https = require('https')
const path = require("path");
var hostname="localhost";
var port=3001;

var app=express();

app.use(function(req,res,next){
    console.log(req.url);
    console.log(req.method);
    console.log(req.path);
    console.log(req.query.id);

    if(req.method!="GET"){
        res.type('.html');
        var msg="<html><body>This server only serves web pages with GET!</body></html>";
        res.end(msg);
    }else{
        next();
    }
});

app.use(serveStatic(__dirname+"/public"));

https.createServer({
    key: fs.readFileSync(path.resolve(__dirname, '../ssl/server.key')),
    cert: fs.readFileSync(path.resolve(__dirname,'../ssl/server.cert'))
}, app).listen(port, function() {
            console.log(`Web App Hosted at https://${hostname}:${port}`);
        })