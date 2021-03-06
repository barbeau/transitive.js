
/**
 * Dependencies
 */

var augment = require('augment');

var Point = require('./index');

/**
 *  Place: a Point subclass representing a 'place' that can be rendered on the
 *  map. A place is a point *other* than a transit stop/station, e.g. a home/work
 *  location, a point of interest, etc.
 */

var Stop = augment(Point, function(base) {

  this.constructor =  function(data) {
    base.constructor.call(this, data);

    this.patterns = [];

    // flag indicating whether this stop is the endpoint of a pattern
    this.isEndPoint = false;

    // flag indicating whether this stop is a point of convergence/divergence between 2+ patterns
    this.isBranchPoint = false;

    this.patternRenderData = {};
    this.patternFocused = {};
    this.patternCount = 0;
    
    this.mergedType = 'POLYGON';
  };

  /**
   * Get id
   */

  this.getId = function() {
    return this.stop_id;
  };

  /**
   * Get type
   */

  this.getType = function() {
    return 'STOP';
  };


  /**
   * Get name
   */

  this.getName = function() {
    return this.stop_name.replace('METRO STATION', '');
  };


  /**
   * Get lat
   */

  this.getLat = function() {
    return this.stop_lat;
  };


  /**
   * Get lon
   */

  this.getLon = function() {
    return this.stop_lon;
  };


  this.addPattern = function(pattern) {
    if(this.patterns.indexOf(pattern) === -1) this.patterns.push(pattern);
  };

  /**
   * Add render data
   *
   * @param {Object} stopInfo
   */

  this.addRenderData = function(stopInfo) {
    if(stopInfo.segment.getType() === 'TRANSIT') {
      this.patternRenderData[stopInfo.segment.pattern.pattern_id] = stopInfo;
      this.addPattern(stopInfo.segment.pattern);
    }
    this.patternCount = Object.keys(this.patternRenderData).length;
  };


  this.isPatternFocused = function(patternId, focused) {
    if(!(patternId in this.patternFocused)) return true;
    return(this.patternFocused[patternId]);
  };

  this.setPatternFocused = function(patternId, focused) {
    this.patternFocused[patternId] = focused;
  };


  this.setAllPatternsFocused = function(focused) {
    for(var key in this.patternRenderData) {
      this.patternFocused[key] = focused;
    }
  };


  /**
   * Draw a stop
   *
   * @param {Display} display
   */

  this.draw = function(display) {

    if(Object.keys(this.patternRenderData).length === 0) return;
    //if (this.renderData.length === 0) return;

    var renderDataArray = this.getRenderDataArray();

    this.initSvg(display);

    // set up the merged marker
    if(this.patternCount > 1 && this.isSegmentEndPoint) {
      if(this.mergedType === 'CIRCLE') {
        this.mergedMarker = this.markerSvg.append('g').append('circle')
          .data([{ point : this }])
          .attr('class', 'transitive-stop-marker-merged');
      }
      else if(this.mergedType === 'POLYGON') {
        this.mergedMarker = this.markerSvg.append('g').append('path')
          .data([{ point : this }])
          .attr('class', 'transitive-stop-marker-merged');
      }
    }

    // set up the pattern-specific markers
    this.patternMarkers = this.markerSvg.append('g').selectAll('circle')
      .data(renderDataArray)
      .enter()
      .append('circle')
      .attr('class', 'transitive-stop-marker-pattern');

  };

  /**
   * Refresh the stop
   *
   * @param {Display} display
   */

  this.refresh = function(display) {

    if(this.patternCount === 0) return;

    // refresh the pattern-level markers
    this.patternMarkers.data(this.getRenderDataArray());
    this.patternMarkers.attr('transform', function (d, i) {
      var x = display.xScale(d.x) + d.offsetX;
      var y = display.yScale(d.y) - d.offsetY;
      return 'translate(' + x +', ' + y +')';
    });

    // refresh the merged marker
    if(this.mergedMarker) {
      if(this.mergedType === 'CIRCLE') {
        this.mergedMarker
          .datum({ point : this })
          .attr(this.constructMergedCircle(display, 'stops_pattern'));
      }
      else if(this.mergedType === 'POLYGON') {
        this.mergedMarker
          .datum({ point : this })
          .attr(this.constructMergedPolygon(display, 'stops_pattern'));
      }
    }

  };

  this.getRenderDataArray = function() {
    var dataArray = [];
    for(var key in this.patternRenderData) {
      dataArray.push(this.patternRenderData[key]);
    }
    return dataArray;
  };


});

/**
 * Expose `Stop`
 */

module.exports = Stop;
