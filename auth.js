var _ = require('lodash');
var domain = require('wires-domain');
var Promise = require('promise')
var logger = require("log4js").getLogger("server");

domain.service("wiresServerAuth", function() {
   return function(handshakeData, secret, accept) {
      var token = handshakeData._query.token;

      if (token === ( secret||"123") ) {
         logger.info("Connection accepted")
         return accept(null, true);
      }
      logger.info("Connection rejected (invalid token)")
      accept(JSON.stringify({
         status: 500,
         message: "Invalid token"
      }), false)
   }
})
