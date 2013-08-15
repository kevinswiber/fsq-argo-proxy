var argo = require("argo"),
    url = require("url"),
    zlib = require("zlib"),
    http = require("http");

var zipPackage = function(argo) {
  return {
    name:"gzip compression",
    install: function() {
      var serverResponseProto = argo._http.ServerResponse.prototype;
      var serverRequestProto = argo._http.IncomingMessage.prototype
      if(serverRequestProto._argoModified) {
        serverRequestProto._gzipModified = "request";
        var getRequestBodyFunc = serverRequestProto.getBody;
        serverRequestProto.getBody = function(cb) {
          var self = this;
          getRequestBodyFunc.call(this, function(error, body){
            console.log(error);
            if("accept-encoding" in self.headers) {
              var encoding = self.headers["accept-encoding"];
              if (encoding.indexOf('gzip') !== -1) {
                var unzip = zlib.createGunzip();
                var responseBuf = [] 
                self.pipe(unzip);
                unzip
                  .on('data', function(data){
                    responseBuf.push(data.toString());
                  })
                  .on('end', function(){
                    var body = responseBuf.join("");
                    cb(null, body);
                  })
                  .on('error', function(error){
                    cb(error)
                  });
              } else {
                cb(null, body);
              }
            } else {
              cb(null, body);
            }
          });
        }
      }

      if(serverResponseProto._argoModified) {
        serverResponseProto._gzipModified = "response";
      }
      
    }
  }
}

argo()
  .include({package:zipPackage})
  .use(function(handle) {
    //Lets transplant our credentials via our proxy
    handle("request", function(env, next){
     var urlObj = url.parse(env.request.url, true);
     if (env.request.url.indexOf('favicon.ico')!== -1) {
        console.log("favicon");
        next(env);
     }
     var query = {
      "client_id":"D2KNC1TFRWRELI0XFVKV1BYOMM2G0G5HIOIJARQQXN34WYCA",
      "client_secret":"5UG1V5I4XHFQQ5XCVBJ2DMCEXA5D2NWBLVTORPFAWB4GF1PM",
      "v":"20130712"
     };
     
     Object.keys(query).forEach(function(param){
      urlObj.query[param] = query[param];
     });

     delete urlObj.search;
     env.request.url = url.format(urlObj); 
     next(env);
    });
    handle("response", function(env, next){
      env.target.response.getBody(function(err, body){
         if(err) {
           console.log(err);
         } else {
           console.log(body.toString());
         }
         next(env);
      });
    });
  })
  .target('https://api.foursquare.com/v2/')
  .listen(process.env.PORT || 3000);