var argo = require("argo"),
    url = require("url");

argo()
  .use(function(handle) {
    //Lets transplant our credentials via our proxy
    handle("request", function(env, next){
     var urlObj = url.parse(env.request.url, true);
     console.log(urlObj.query.ll);
     var query = {
      "client_id":"D2KNC1TFRWRELI0XFVKV1BYOMM2G0G5HIOIJARQQXN34WYCA",
      "client_secret":"5UG1V5I4XHFQQ5XCVBJ2DMCEXA5D2NWBLVTORPFAWB4GF1PM",
      "v":"20130712"
     };
     
     Object.keys(query).forEach(function(param){
      console.log(param);
      urlObj.query[param] = query[param];
     });

     delete urlObj.search;
     console.log("URL:"+url.format(urlObj));
     env.request.url = url.format(urlObj); 
     next(env);
    });
    handle("response", function(env, next){
      env.target.response.getBody(function(err, body){
        //console.log(err);
        //console.log(body.toString('utf-8'));
        var venues = [];
        var body = JSON.parse(body.toString('utf-8'));
        if(body.response.groups) {
          body.response.groups.forEach(function(group){
            group.items.forEach(function(venue){
              venues.push({
                "name":venue.venue.name, 
                "city":venue.venue.location.city,
                "location":{
                  "lat":venue.venue.location.lat, 
                  "lng":venue.venue.location.lng
                }
              });
            });
          });
        } else {
          venues.push({
            "name":body.response.venue.name,
            "city":body.response.venue.location.city,
                "location":{
                  "lat":body.response.venue.location.lat, 
                  "lng":body.response.venue.location.lng
                }
          });
        }
        env.target.response.body = JSON.stringify(venues); 
        next(env);
      });
    });
  })
  .target('https://api.foursquare.com/v2/')
  .listen(process.env.PORT || 3000);
