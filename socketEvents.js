var mongoClient = require("mongodb").MongoClient;
var mongoose = require('mongoose');
var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];



exports = module.exports = function(io) {
  const connections = [];
  const closedRooms = [];
  io.on("connection", function(socket) {
    connections.push(socket);
    console.log("a user connected to the app");

    socket.on("join room", function(roomName) {
      if(!closedRooms.includes(roomName)){
        //this checks if user already joined the room
        if(!io.sockets.adapter.sids[socket.id][roomName]){
      socket.join(roomName);
      io.sockets.in(roomName).emit("message", "Someone joined the room");
      console.log("someone joined", roomName);

      var length = io.nsps["/"].adapter.rooms[roomName].length;
      console.log("there is now", length, "connected to", roomName);
      

      //Updating messages
      
  mongoose.connect(
    config.database.url,
    { useNewUrlParser: true },
    (err, db) => {
      var collection = db.collection("chat messages");
      var stream = collection
        .find()
        .sort({ _id: -1 })
        .limit(10)
        .stream();
      stream.on("data", function(chat) {
        socket.emit("chat", chat.content);
      });
    }
  
  );
    }}
    });
    socket.on("message", function(msg, room) {
      socket.broadcast.emit("chat", msg);
      
 
        // socket.emit("chat", msg);
    
  
      mongoose.connect(
        config.database.url,
        { useNewUrlParser: true },
        (err, db) => {
          var collection = db.collection("chat messages");
          collection.insertOne({ content: msg, room: room }, function(err, db) {
            if (err) {
              console.warn(err.message);
            } else {
              console.log("chat message inserted into db: " + msg);
            }
          });
        }
      );

      io.in(room).emit("message send", "test message from server");
    });
    socket.on("message notself", function(room) {
      var msg = "the sender does not get this";
      socket.to(room).emit("message send2", "the sender does not get this");
    });
    socket.on("game: ready to start", function(room) {
      closedRooms.push(room);
      console.log(room + "is now closed")
    });

    socket.on("game:deal cards", function(cards) {
      var players = Object.keys(io.sockets.sockets)
      var amountOfCards =  cards.length / players.length
      for (var i = 0; i < players.length + 1 ; i++) {
  
        var dealtCards = cards.splice(0, amountOfCards);
          if(players[i] !== socket.id){
        socket.broadcast.to(players[i]).emit("game: dealing cards", dealtCards )}else{
          socket.emit("game: dealing cards", dealtCards )
          socket.emit("game: ready to start", "ready" )
        }
      
     };
      console.log(amountOfCards)      
    });
    socket.on("leave room", function(roomName) {
      //it will be true if is the socket is in room and undefined if it is not
      if (io.sockets.adapter.sids[socket.id][roomName]) {
        socket.leave(roomName);
        console.log("someone left", roomName);
      } else {
        console.log("you cant leave what you havent joined");
      }
    });

    socket.on("disconnect", () => {
      const index = connections.indexOf(socket);
      // connections.splice(index, 1);
      console.log("socket disconnect...", socket.id);
    });

    socket.on("error", function(err) {
      console.log("received error from socket:", socket.id);
      console.log(err);
    });
   
  });
};