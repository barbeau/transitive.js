
/**
 * Dependencies
 */

var d3 = require('d3');

var Transitive = require('transitive');
var OtpProfiler = require('otpprofiler.js');

// initialize the transitive display

var endpoint = 'http://arlington.dev.conveyal.com/otp/otp-rest-servlet/';
//var endpoint = 'http://localhost:8001/otp-rest-servlet/';

/*var config = {
  maxOptions: 3,
  fromLocation: {
    name: 'Start: ATP Office',
    lat:  38.97366769171168, // 38.894624, // 38.890519,
    lon: -76.99845170268316 // -77.074159 //-77.086252
  },
  toLocation: {
    name: 'End: Union Station',
    lat: 38.894797858735274, //38.89788,
    lon: -77.0740644088446 //-77.00597
  }
};*/

var config = {
  maxOptions: 3,
  fromLocation: {
    name: 'Start: ATP Office',
    lat: 38.894624, // 38.890519,
    lon: -77.074159 //-77.086252
  },
  toLocation: {
    name: 'End: Union Station',
    lat: 38.89788,
    lon: -77.00597
  }
};

var init = function(profileResponse) {

  var TransitiveLoader = new OtpProfiler.transitive.TransitiveLoader(profileResponse, endpoint, function(transitiveData) { 

    console.log("generated transitive data:");
    console.log(transitiveData);

    var transitive = new Transitive(document.getElementById('canvas'), transitiveData, STYLES, {
      gridCellSize : 800,
      drawGrid: true 
    });

    // apply computed behaviors
    transitive.on('render', function (transitive) {
      each(COMPUTED, function (behavior) {
        behavior(transitive);
      });
    });

    transitive.render();

    // set the journey option list
    transitiveData.journeys.forEach(function(journey, index) {
      var div = document.createElement("div");
      div.id = journey.journey_id;
      div.className = 'listItem';
      div.innerHTML = journey.journey_name;

      div.onmouseover=function(event) {
        //d3.selectAll('.transitive-path-highlight').style('visibility', 'hidden');
        //d3.select('#transitive-path-highlight-journey-' + event.target.id).style('visibility', 'visible');
        //d3.selectAll('.transitive-transfer-stops-journey-' + event.target.id).style('visibility', 'visible');
        transitive.focusJourney(event.target.id);
      };
      div.onmouseout=function(event) {
        //d3.selectAll('.transitive-path-highlight').style('visibility', 'hidden');
        //d3.selectAll('.transitive-transfer-stops-journey-' + event.target.id).style('visibility', 'hidden');
        transitive.focusJourney();

      };      
      document.getElementById('list').appendChild(div);
    });

  }, config);

};



/** dynamically loaded data example **/

var profileRequest = new OtpProfiler.models.OtpProfileRequest({
  from : config.fromLocation.lat+','+config.fromLocation.lon,
  to : config.toLocation.lat+','+config.toLocation.lon
});
profileRequest.urlRoot = endpoint + 'profile';
profileRequest.on('success', init);
profileRequest.request();



/** hard-coded data example **/

//init(new OtpProfiler.models.OtpProfileResponse(P2));
