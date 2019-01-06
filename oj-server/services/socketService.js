 var redisClient = require('../modules/redisClient');
 const TIMEOUT_IN_SECONDS = 3600;

module.exports = function(io) {
  /*
  io.on('connection', (socket) => {
    console.log(socket);
    var message = socket.handshake.query['message'];
    console.log(message);
    io.to(socket.id).emit('message', 'hehe from server');
  })
  */

  var collaborations = [];
  var socketIdToSessionId = [];

  var sessionPath = "/temp_sessions";

  io.on('connection', (socket) => {
    let sessionId = socket.handshake.query['sessionId'];
    socketIdToSessionId[socket.id] = sessionId;

    if (sessionId in collaborations) {
      collaborations[sessionId]['participants'].push(socket.id);
    } else {
      redisClient.get(sessionPath + '/' + sessionId, function(data) {
        if (data) {
          console.log("session terminated previsouly: pulling back from Redis.");
          collaborations[sessionId] = {
            'cachedChangeEvents': JSON.parse(data),
            'participants' : []
          };
        } else {
          console.log("Creating new session");
          collaborations[sessionId] = {
            'cachedChangeEvents' : [],
            'participants' : []
          };
        }
        collaborations[sessionId]['participants'].push(socket.id);

      });
    }


    // socket event listener
    socket.on('change', delta => {
      let sessionId = socketIdToSessionId[socket.id];
      if (sessionId in collaborations) {
        collaborations[sessionId]['cachedChangeEvents'].push(["change", delta, Date.now()]);
      }
      forwardEvents(socket.id, 'change', delta);
    });

    //cursorMove event handler
    socket.on('cursorMove', cursor => {
      cursor = JSON.parse(cursor);
      cursor['socketId'] = socket.id;

      forwardEvents(socket.id, 'cursorMove', JSON.stringify(cursor));

    });

    socket.on('restoreBuffer', ()=> {
      let sessionId = socketIdToSessionId[socket.id];
      console.log('restoring buffer for session: ' + sessionId + ', socket: ' + socket.id);
      if (sessionId in collaborations) {
        let changeEvents = collaborations[sessionId]['cachedChangeEvents'];
        for (let i = 0; i < changeEvents.length; i++) {
          socket.emit(changeEvents[i][0], changeEvents[i][1]);
        }
      }
    });

    socket.on('disconnect', function() {
      let sessionId = socketIdToSessionId[socket.id];
      console.log('socket' + socket.id + 'disconnected');

      if (sessionId in collaborations) {
        let participants = collaborations[sessionId]['participants'];
        let index = participants.indexOf(socket.id);
        if (index >= 0) {
          participants.splice(index, 1);
          if (participants.length == 0) {
            console.log("last guy left. Storing in Redis");
            let key = sessionPath + "/" + sessionId;
            let value = JSON.stringify(collaborations[sessionId]['cachedChangeEvents']);
            redisClient.set(key, value, redisClient.redisPrint);
            redisClient.expire(key, TIMEOUT_IN_SECONDS);
            delete collaborations[sessionId];
          }
        }
      }
    });


    function forwardEvents(socketId, eventName, dataString) {
      const sessionId = socketIdToSessionId[socketId];

      if (sessionId in collaborations){
          const participants = collaborations[sessionId]['participants'];
          for (let participant of participants) {
              if (socket.id !== participant){
                  io.to(participant).emit(eventName, dataString);
              }
          }
      } else {
          console.error('WARNING: could not tie socketid to any collaboration error');
      }

    }
    //
    // const forwardEvents = function(socketId, eventName, dataString) {
    //     const sessionId = socketIdToSessionId[socketId];
    //         if (sessionId in collaborations) {
    //             const participants = collaborations[sessionId]['participants'];
    //             for (let item of participants) {
    //                 if (socketId != item) {
    //                     io.to(item).emit(eventName, dataString);
    //                 }
    //             }
    //         } else {
    //             console.log('You have a bug');
    //         }
    // }
  });
}
