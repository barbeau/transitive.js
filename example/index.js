
/**
 * Dependencies
 */

var select = require('select');
var Set = require('set');
var Transitive = require('transitive');

// Globals

var DIRECTION = '0';
var ROUTE = null;
var STOPS = new Set();

// handle selects
var Routes = select().label('Routes');
var Patterns = select().multiple().label('Patterns');

document.getElementById('select-route').appendChild(Routes.el);
document.getElementById('select-pattern').appendChild(Patterns.el);

// transitive instance
var transitive = new Transitive(document.getElementById('canvas'), INDEX_FULL);

// Set up filters
transitive
  .filter('stops', function (stop) {
    return STOPS.has(stop.stop_id);
  })
  .filter('routes', function (route) {
    return ROUTE.route_id === route.route_id;
  })
  .filter('patterns', function (pattern) {
    return Patterns.values().indexOf(pattern.pattern_id) !== -1;
  });

// on rendered
transitive.on('render', function (transitive) {
  each(COMPUTED, function (behavior) {
    behavior(transitive);
  });
});

// Direction check box
var $reverse = document.getElementById('reverse-direction');

// on direction change
$reverse.addEventListener('change', function (event) {
  DIRECTION = event.target.checked
    ? '1'
    : '0';

  // only show appropriate patterns
  updatePatterns(Patterns, ROUTE, DIRECTION);
  transitive.render();
});

// flip style
var $style = document.getElementById('alternative-style');

// on click
$style.addEventListener('change', function (event) {
  transitive.style.reset();

  if (event.target.checked) {
    transitive.style.load({
      labels: {
        cursor: function () { return 'pointer'; }
      },
      stops: {
        'stroke-opacity': function (display, data) {
          if (data.stop.isEndPoint) {
            if (data.pattern.frequency.average > 12) return false;
            if (data.pattern.frequency.average > 6) return 0.5;
            return 0.25;
          }
        }
      },
      patterns: {
        opacity: function (display, data) {
          if (data.frequency.average > 12) return false;
          if (data.frequency.average > 6) return 0.5;
          return 0.25;
        },
        'stroke-dasharray': function() { return false; }
      }
    })
  }

  transitive.render();
});

// On route selection change
Routes.on('select', function (option) {
  localStorage.setItem('selected-route', option.name);

  ROUTE = getRoute(option.name);
  STOPS = getStopIds(ROUTE);

  // only show appropriate patterns
  updatePatterns(Patterns, ROUTE, DIRECTION);
  transitive.render();
});

// add routes
for (var i in INDEX.routes) {
  var route = INDEX.routes[i];
  Routes.add(route.route_id);
}

// Select the first route
Routes.select(localStorage.getItem('selected-route') || INDEX.routes[0].route_id.toLowerCase());

/**
 * Update patterns
 */

function updatePatterns(patterns, route, direction) {
  // unbind all events
  patterns.off('change');
  patterns.empty();

  for (var i in route.patterns) {
    var pattern = route.patterns[i];
    if (pattern.direction_id === direction) {
      patterns.add(pattern.pattern_name + ' ' + pattern.pattern_id, pattern.pattern_id);
      patterns.select(pattern.pattern_name.toLowerCase() + ' ' + pattern.pattern_id);
    }
  }

  patterns.on('change', function() {
    transitive.render();
  });
}

// get a route

function getRoute(id) {
  for (var i in INDEX_FULL.routes) {
    var route = INDEX_FULL.routes[i];
    if (route.route_id.toLowerCase() === id) {
      return route;
    }
  }
}

// get the stops for a route

function getStopIds(route) {
  var stop_ids = new Set();
  for (var i in route.patterns) {
    var pattern = route.patterns[i];
    for (var j in pattern.stops) {
      stop_ids.add(pattern.stops[j].stop_id);
    }
  }

  return stop_ids;
}
