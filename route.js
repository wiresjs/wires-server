var _ = require('lodash');
var domain = require('wires-domain');
var Promise = require('promise')
var logger = require("log4js").getLogger("server");

domain.service("wiresServerRoute", function($io) {
   return function(packageName, socket) {
      var scope = {
         log : undefined,
      }
      socket.on("disconnect", function(data){
         if ( _.isFunction(scope.onDisconnect) ){
            scope.onDisconnect();
         }
         logger.info("Client disconnected")
      })
      socket.on("event", function(data) {

         var jobId = data.jobId;
         var command = data.command;
         var message = data.message;

         var serviceName = (packageName || "controllers") + "." + command;
         logger.info("----------")
         logger.info("Requested " + serviceName + " (" + jobId + ")")
         logger.info("With message " + JSON.stringify(message))
         if (domain.isServiceRegistered(serviceName)) {
            logger.info("Service found (" + serviceName + ")")
            domain.require(serviceName, function(service) {
               logger.info("Binding events for " + jobId)
               scope.log = function(message) {
                  // Logging
                  logger.info("@" + command + " -> log " + JSON.stringify(message));
                  socket.emit("log", {
                     jobId: jobId,
                     message: message
                  })
               }
                  // calling the service
               service(message, scope).then(function(message) {
                  logger.info("@" + command + " -> finished " + JSON.stringify(message));
                  socket.emit("finished", {
                     jobId: jobId,
                     message: message
                  })
               }).catch(function(error) {
                  logger.fatal("@" + command + " -> rejected " + JSON.stringify(error));
                  socket.emit("failed", {
                     jobId: jobId,
                     message: error
                  })
               })

            }).catch(function(e) {
               logger.fatal(JSON.stringify(e))
               socket.emit("error", {
                  jobId: jobId,
                  message: "No controller registered"
               });
               if (socket.connected) {
                  socket.disconnect();
               }
            })
         } else {
            logger.info("No controller registered " + command)
            socket.emit("failed", {
               jobId: jobId,
               message: "No controller registered"
            });
            if (socket.connected) {
               socket.disconnect();
            }
         }
      });
   }
})
