 var redisClient = require('../modules/redisClient');
 const TIMEOUT_IN_SECONDS = 3600;

module.exports = function(io) {
  // io is an instance of socket_io
  // a singleton
  var collaborations = [];
  var socketIdToSessionId = [];
  var sessionPath = "/temp_sessions";

  io.on('connection', (socket) => {
    let sessionId = socket.handshake.query['sessionId'];
    socketIdToSessionId[socket.id] = sessionId;

    if (sessionId in collaborations) {
      collaborations[sessionId]['participants'].push(socket.id);
    } else {
      // first one
      redisClient.get(sessionPath + '/' + sessionId, function(data) {
        if (data) {
          console.log("session terminated previsouly: pulling back from Redis.");
          collaborations[sessionId] = {
            'cachedChangeEvents': JSON.parse(data),
            'participants' : []
          };
        } else {
          // the first one ever worked on this problem
          console.log("Creating new session");
          collaborations[sessionId] = {
            'cachedChangeEvents' : [],
            'participants' : []
          };
        }
        // add the current socket.io to participants list
        collaborations[sessionId]['participants'].push(socket.id);
      });
    }


    // socket event listener
    socket.on('change', delta => {
      let sessionId = socketIdToSessionId[socket.id];
      // put the change into collaborations cachedChangeEvents
      if (sessionId in collaborations) {
        collaborations[sessionId]['cachedChangeEvents'].push(["change", delta, Date.now()]);
      }
      // then forward the change to everyone else working on the same session
      forwardEvents(socket.id, 'change', delta);
    });

    //cursorMove event handler
    socket.on('cursorMove', cursor => {
      cursor = JSON.parse(cursor);
      // add socketId to cursor object
      // in editor, draw a cursor with different color for different client
      cursor['socketId'] = socket.id;
      // forward the cursorMove event to everyone else
      forwardEvents(socket.id, 'cursorMove', JSON.stringify(cursor));
    });

    // restoreBuffer, restore the content for new user
    socket.on('restoreBuffer', ()=> {
      // send the cachedChangeEvents to newly joined client
      // the cachedChangeEvents are either already in memory (if someone working on this session now)
      // or it's pulled from Redis (if this is the first client)
      let sessionId = socketIdToSessionId[socket.id];
      console.log('restoring buffer for session: ' + sessionId + ', socket: ' + socket.id);
      if (sessionId in collaborations) {
        let changeEvents = collaborations[sessionId]['cachedChangeEvents'];
        for (let i = 0; i < changeEvents.length; i++) {
          // sent ('change', delta) to client
          // the changes will be handled by change event handler on client side
          socket.emit(changeEvents[i][0], changeEvents[i][1]);
        }
      }
    });

    socket.on('disconnect', function() {
      let sessionId = socketIdToSessionId[socket.id];
      console.log('socket' + socket.id + 'disconnected');

      if (sessionId in collaborations) {
        // find all participants working on this session
        let participants = collaborations[sessionId]['participants'];
        // find the client that is leaving
        let index = participants.indexOf(socket.id);
        if (index >= 0) {
          // remove the leaving client from participants
          participants.splice(index, 1);
          if (participants.length == 0) {
            console.log("last guy left. Storing in Redis");
            // if the client is the last client, save the cachedChangeEvents to redis
            let key = sessionPath + "/" + sessionId;
            let value = JSON.stringify(collaborations[sessionId]['cachedChangeEvents']);
            redisClient.set(key, value, redisClient.redisPrint);
            // key will be expired in one hour
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
  });
}
