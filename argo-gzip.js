      var enc_type = env.target.response.headers['content-encoding'];
      var response_buffer = []
      if (enc_type && enc_type === 'gzip') {
        var unzip = zlib.createGunzip();
        console.log("gzip");
        env.target.response.pipe(unzip);
        unzip.on('data', function(data){
          console.log('data event');
          response_buffer.push(data.toString());
        }).on('end', function(){
          var venues = [];
          var body = JSON.parse(response_buffer.join(""));
          console.log(body);
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
          var response_body = JSON.stringify(venues);
          var buf = new Buffer(response_body);
          zlib.gzip(buf, function (_, result) {   
            env.target.response.body = result; 
            next(env);
          });
        }).on('error', function(error){
          console.log(error);
        })
      } else {
        env.target.response.getBody(function(error, body){
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
          } else if(body.response.venue) {
            venues.push({
              "name":body.response.venue.name,
              "city":body.response.venue.location.city,
                  "location":{
                    "lat":body.response.venue.location.lat, 
                    "lng":body.response.venue.location.lng
                  }
            });
          } else {
            next(env);
          }
          env.target.response.body = JSON.stringify(venues); 
          next(env);
        });
      }