

var express = require('express');
var serveStatic = require('serve-static');
var app = require('./controller/app.js');
const path = require("path");


var fs = require('fs')
var https = require('https')
var hostname = "localhost";


var port = 8081;

app.use(serveStatic(__dirname + '/public')); 

https.createServer({
    key: fs.readFileSync(path.resolve(__dirname, '../ssl/server.key')),
    cert: fs.readFileSync(path.resolve(__dirname,'../ssl/server.cert'))
}, app).listen(port, function() {
            console.log(`Web App Hosted at https://${hostname}:${port}`);
        })




