'use strict';

  //Value -> Simple KV 
  //Factory -> DI, Initialization, Delayed
  //Service -> like Factory w invoke 'new'
  //Provider -> expose an API for application-wide configuration
  //Constant -> config phase
  angular
    .module('ngJacknifeStreaming', [])
  .provider('stompFactory', function() { // core recipe type

    var protocols = [
        'websocket', 'xdr-streaming', 'xhr-streaming','eventsource',
        'iframe-eventsource', 'htmlfile', 'iframe-htmlfile',
        'xdr-polling', 'xhr-polling', 'iframe-xhr-polling',
        'jsonp-polling'
    ];

    this.setProtocols = function(_protocols){
      this.protocols = _protocols;
    }

    // expose to provider
    this.$get = function ($timeout,$rootScope,$log) {

      return function stompFactory(options) {

        options = options || {};

        options.protocols_whitelist = protocols;

        //blank for now as haven't decided what data to add
        var headers ={};
        var stompClient;
        // > X retry.. force user to re-login
        var connectionRetries = 0;
        
        var stompFailureCallback = function (error) {
          $rootScope.$broadcast('event:stomp-disconnected',error);
          $log.error('STOMP: connect fail! ' + error);
          if(manualConnect){
            connectionRetries++;
            if(connectionRetries > 3){
              $log.warn('STOMP: redirecting to login');
               $rootScope.$broadcast('event:auth-loginRequired');
            }
            else{
              $log.warn('STOMP: Waiting before reconnect.');
              $timeout(connect,5000);
            }
            
          }
        };

        var stompSubscribe = function(callbacks,topic){
             $log.info('STOMP Subscribing:' + topic + ' with ' + callbacks.length + ' callbacks.');
            var subscription = stompClient.subscribe(topic, function(raw){
              try{
                var msg = JSON.parse(raw.body);
                $log.debug('STOMP Looping ' + callbacks.length + ' callbacks for ' + topic);
                angular.forEach(callbacks, function(callback){
                  callback(msg);
                });
              }
              catch(e){
                $log.error(e);
              }
            });
            stompSubscriptions[topic] = subscription;
        };


        var stompSuccessCallback = function (msg) {
          $rootScope.$broadcast('event:stomp-connected',stompClient.ws.protocol);
          $log.info('STOMP Connected. protocol:' + stompClient.ws.protocol + ',msg:' + msg);
          connectionRetries = 0;
          stompSubscriptions = {}; //reset the subscriptions & re-subcribe
          angular.forEach(stompCallbacks,function(callbacks,topic){
            if(callbacks === null){
              $log.error('Error!!! topic has null callbacks:' + topic);
              return;
            }
            stompSubscribe(callbacks,topic);
          });
          
          //need to use timeout for resend as there will be some issue when
          //we are using the same callback
          //CONNECT even will have SEND info and that seems to be screwing up the connection
          resend(queuedMsgs);

          queuedMsgs = [];
        };

        function resend(msgs){
          var queuedMsg = angular.copy(msgs);
          $timeout(function(){
          angular.forEach(queuedMsgs,function(m){
             stompClient.send(m.dest, headers, JSON.stringify(m.msg));
             $log.info('STOMP resent:' + m);
          });
          },500);

        }

        function connect(){
          manualConnect = true;
          if(stompClient && stompClient.connected){
            $log.info('STOMP already connected.');
            return;
          }
          console.log('STOMP connecting.');
          //2nd var is deprecated
          //options.url is registry.addEndpoint on SpringBoot
          var sockSocket = new SockJS(options.url,null, options);
          stompClient = Stomp.over(sockSocket);
          stompClient.connect(headers, stompSuccessCallback,stompFailureCallback);
          //Can't use sockSocket.[onopen,onclose,onmesssage] as it will override STOMP api
        }

        //keep track if really wants to connect
        var manualConnect = false;
        var queuedMsgs = [];

        function disconnect(){
            manualConnect = false;
            queuedMsgs = [];
            stompClient.disconnect();
        }

        //topic to client callback
        var stompCallbacks = {};
        //topic to subscription callback
        var stompSubscriptions = {};

        function subscribe(topic, callback) {

            //if no server callback.. subscribe
            if(!stompCallbacks[topic]){
              stompCallbacks[topic] = [];
            }
            else{
              $log.warn('STOMP already subscribed:' + topic);
            }
            //if callback is not there, add it
            if(stompCallbacks[topic].indexOf(callback) === -1){
              $log.info('STOMP added callback on topic:' + topic);
              stompCallbacks[topic].push(callback);
            }

            if(!stompClient || !stompClient.connected){
              connect();
            }
            else{
              stompSubscribe(stompCallbacks[topic],topic);
            }


            return this;
          }

          function unsubscribe(topic, callback) {
            if(!stompCallbacks[topic]){
              console.log('STOMP no topic for unsubscription:' + topic);
              return;
            }

            var i = stompCallbacks[topic].indexOf(callback);
            if(i === -1){
              $log.warn('STOMP no callback found for unsubscription:' + topic);
              return;
            }
            //remove
            stompCallbacks[topic].splice(i,1);
            $log.info('STOMP callback unsubscribed:' + topic);

            if(_.isEmpty(stompCallbacks[topic])){
              stompCallbacks[topic] = null;
              stompSubscriptions[topic].unsubscribe();
              $log.info('STOMP unsubscribe:' + topic);
            }

          }

          function send(dest,msg) {
            if(!stompClient || !stompClient.connected){
              $log.info('STOMP queued msg:' + msg);
              queuedMsgs.push({
                dest:dest,
                msg:msg
              });
            }
            else{
              stompClient.send(dest, headers, JSON.stringify(msg));
              $log.info('STOMP sent msg:' + msg);
            }
            
        }
        var wrapped = {
          connect:connect,
          disconnect: disconnect,
          subscribe: subscribe,
          unsubscribe: unsubscribe,
          send: send
        };

        return wrapped;
      };
    };

  })
  ;
