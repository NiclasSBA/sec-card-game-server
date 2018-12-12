
const express = require('express');
const app = express();
// const http = require('http');
var server = app.listen(3001);
var io = require('socket.io').listen(server);
var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
let router = require('express').Router();

var socketEvents = require('./socketEvents');
//Mongo db




 
 var bodyParser = require('body-parser')
 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({extended: false}))



app.get('/messages', (req, res) => {
  Message.find({},(err, messages)=> {
    res.send(messages);
  })
})




// app.set( "ipaddr", "127.0.0.1" );
// app.set( "port", port );

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", "true");
 
  next();
});

 socketEvents(io);
  

 server.listen(config.server.port, function(){
   console.log('listening on port ', config.server.port);
  
 });





