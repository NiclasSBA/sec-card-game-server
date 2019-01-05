var mongoClient = require("mongodb").MongoClient;
var mongoose = require("mongoose");
var env = process.env.NODE_ENV || "development";
var config = require("./config")[env];
var crypto = require("crypto");

// Some places i use rooName as var name, other places i use gameId
// as of 20/12 they are the same thing, a reference to the roomid
exports = module.exports = function(io) {
  const connections = [];
  const closedRooms = [];
  io.on("connection", function(socket) {
    var addedUser = false;
    connections.push(socket);
    console.log("a user connected to the app");

    socket.on("add nickname", username => {
      // if(addedUser) return;
      if (username != socket.username) {
        // console.log(username)
        // io.sockets.in(gameId).emit("message", "A player changed name");
        // console.log(clientList)

        socket.username = username;
        // console.log(socket)
      }
      // addedUser = true;
    });
    socket.on("create game room", function() {
      const id = crypto.randomBytes(16).toString("hex");
      console.log(id);
      socket.emit("created game room", id);
    });
    socket.on("join room", function(roomName) {
      if (!closedRooms.includes(roomName)) {
        //this checks if user already joined the room
        if (!io.sockets.adapter.sids[socket.id][roomName]) {
          socket.join(roomName);

          var clientList = io.sockets.adapter.rooms[roomName];
          // console.log(clientList.length)
          if (clientList.length > 1) {
            if (socket.username) {
              // io.sockets.in(roomName).emit('user joined room', socket);
            }
            io.sockets.in(roomName).emit("message", "Someone joined the room");
            // console.log("someone joined", roomName);
            // console.log("you are not admin of this room")
            var length = io.nsps["/"].adapter.rooms[roomName].length;
            console.log("there is now", length, "connected to", roomName);
          } else {
            console.log("you are admin of this room");
            socket.emit("game: set admin");
            // io.in(roomName).emit('user joined room', socket.username);
            //  socket.emi
          }
          var prevUsers = io.nsps["/"].adapter.rooms[roomName];
          // Here i tell all(including sender) sockets connected to room, that a player connected
          io.in(roomName).emit("user joined room", socket.username, prevUsers);
          //Updating messages

          // mongoose.connect(
          //   config.database.url,
          //   { useNewUrlParser: true },
          //   (err, db) => {
          //     var collection = db.collection("chat messages");
          //     var stream = collection
          //       .find()
          //       .sort({ _id: -1 })
          //       .limit(10)
          //       .stream();
          //     stream.on("data", function(chat) {
          //       socket.emit("chat", chat.content);
          //     });
          //   }
          // );
        }
      }
    });

    socket.on("game: give points", function(game) {
      var prevUsers = io.nsps["/"].adapter.rooms[game.gameId];
      //  console.log("trying to give points to", game.currentPlayer);
      io.in(game.gameId).emit("game: giving points", game.currentPlayer);
      // socket.broadcast.emit("game: giving points",prevUsers);
    });
    socket.on("game: play card", function(game) {

      io.in(game.gameId).emit("game: playing card", game);
    });
    socket.on("game: move to next user", function(game) {
      //  arguments is a variable that finds all arguments passed to a function
      // console.log("trying to move current user", arguments);
      var gameId = game.gameId;
      var userId = game.currentPlayer.id;

      var players = game.players;

      game.players.map((user, index) => {
        if (game.currentPlayer.id === user.id) {
          // console.log("found a player", index, players.length)
          if (index +1 === players.length) {
            // console.log(user);
            io.in(gameId).emit(
              "game: moving to next user",
              players[0]
            );
          } else {
            var user2 = players[index +1];
            io.in(gameId).emit("game: moving to next user", user2);
          }
        } 
      });
      // io.in(gameId).emit("game: moving to next user",player);
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
      console.log(room + "is now closed");
    });

    socket.on("game:deal cards", function(cards, gameId) {
      console.log(gameId);
      // if(gameId){
      var players = Object.keys(io.sockets.adapter.rooms[gameId]["sockets"]);
      console.log(players);

      var amountOfCards = cards.length / players.length;
      for (var i = 0; i < players.length + 1; i++) {
        var dealtCards = cards.splice(0, amountOfCards);
        if (players[i] !== socket.id) {
          socket.broadcast
            .to(players[i])
            .emit("game: dealing cards", dealtCards);
        } else {
          socket.emit("game: dealing cards", dealtCards);
        }
        socket.emit("game: ready to start", gameId);
      }
      // console.log(amountOfCards)
    });
    socket.on("game: start game", function(game) {

      //We want to inform all players that the game is started
      io.in(game.gameId).emit("game: game is started", game);
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
