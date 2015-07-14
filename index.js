var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var domain = require("wires-domain")
var logger = require("log4js").getLogger("server");
var auth = require('./auth')
var route = require('./route')

domain.service("controllers.test", function(){
   return function(message, scope) {

      return new Promise(function(resolve, reject) {
         var pingme = true;
         scope.onDisconnect = function(){
            pingme = false;
         }
         var myInterval = setInterval(function(){
            scope.log("Sending you something here " + new Date());
            if ( pingme === false ){
               console.log("Stop sending...")
               clearInterval(myInterval)
            }
         },1000)
      })
   }
})

module.exports = function(port, secret, packageName){

   domain.service("$io", function() {
      return io;
   })

   server.listen(port || 3020, function() {
      logger.info("Listening for package '" + (packageName || "controllers") + "'" )
      logger.info("Secret is '" + (secret||"123") + "'" )
      logger.info("Wires server is ready on port:" + (port || 3020) )
   });

   io.set('authorization', function(handshakeData, accept) {
      domain.require(function(wiresServerAuth) {
         wiresServerAuth(handshakeData, secret, accept)
      })
   });
   io.on('disconnect', function(socket) {
      logger.info("Disconnected")
   });
   io.on('connection', function(socket) {
      domain.require(function(wiresServerRoute) {
         wiresServerRoute(packageName, socket)
      })
   });

}
