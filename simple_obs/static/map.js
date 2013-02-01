var map;
var obs   = {};
var times = {};
var timeseriesRefreshInterval = 5000; // miliseconds
var maxTimeseriesCount        = 500;  // # of obs in graph (moving window)

var mode = "dev";

// Get rid of address bar on iphone/ipod
var fixSize = function() {
  window.scrollTo(0,0);
  document.body.style.height = '100%';
  if (!(/(iphone|ipod)/.test(navigator.userAgent.toLowerCase()))) {
    if (document.body.parentNode) {
      document.body.parentNode.style.height = '100%';
    }
  }
};
setTimeout(fixSize,700);
setTimeout(fixSize,1500);

var proj900913 = new OpenLayers.Projection("EPSG:900913");
var proj4326   = new OpenLayers.Projection("EPSG:4326");

function init() {
  var obs = new OpenLayers.Layer.Vector(
    'obs'
    ,{styleMap : new OpenLayers.StyleMap({
      'default' : new OpenLayers.Style(
        {
           label             : '${wind_speed_text}'
          ,labelXOffset      : '${labelXOffset}'
          ,labelYOffset      : '${labelYOffset}'
          ,labelOutlineColor : 'white'
          ,labelOutlineWidth : 3
          ,fontColor         : 'black'
          ,fontSize          : '14px'
          ,fontFamily        : 'tahoma,helvetica,sans-serif'
          ,externalGraphic   : "${wind_barb}"
          ,graphicOpacity    : 1
          ,graphicWidth      : 74
          ,graphicHeight     : 75
          ,pointRadius       : 74 / 2
        }
        ,{
          context : {
            wind_speed_text : function(f) {
              var spd;
              var dir;
              for (var t in f.attributes.obs) {
                for (var i = 0; i < f.attributes.obs[t].length; i++) {
                  if (f.attributes.obs[t][i].standard == 'wind_speed') {
                    if (f.attributes.obs[t][i].units == "m/s") {
                      ms_value = f.attributes.obs[t][i].value;
                      knots_value = Math.round(ms_value * 1.94384 * 1000) / 1000;
                    }
                    spd = String(knots_value) + " knots (" + String(ms_value) + ' ' + f.attributes.obs[t][i].units + ")";
                  }
                  else if (f.attributes.obs[t][i].standard == 'wind_direction_from_true_north') {
                    dir = String(Math.round(f.attributes.obs[t][i].value)) + ' \xB0';
                  }
                }
              }
              if (typeof(spd) == 'string' && typeof(dir) == 'string') {
                return spd; // + '\n' + dir;
              }
              else {
                return '';
              }
            }
            ,labelXOffset : function(f) {
              return 0;
              for (var t in f.attributes.obs) {
                for (var i = 0; i < f.attributes.obs[t].length; i++) {
                  if (f.attributes.obs[t][i].standard == 'wind_direction_from_true_north') {
                    return 50 * Math.cos(-f.attributes.obs[t][i].value * (Math.PI / 180));
                  }
                }
              }
              return 0;
            }
            ,labelYOffset : function(f) {
              return 74 / 2 + 10;
              for (var t in f.attributes.obs) {
                for (var i = 0; i < f.attributes.obs[t].length; i++) {
                  if (f.attributes.obs[t][i].standard == 'wind_direction_from_true_north') {
                    return 50 * Math.sin(-f.attributes.obs[t][i].value * (Math.PI / 180));
                  }
                }
              }
              return 0;
            }
            ,wind_barb : function(f) {
              var spd;
              var dir;
              for (var t in f.attributes.obs) {
                for (var i = 0; i < f.attributes.obs[t].length; i++) {
                  if (f.attributes.obs[t][i].standard == 'wind_speed') {
                    if (f.attributes.obs[t][i].units == 'm/s') {
                      spd = Number(f.attributes.obs[t][i].value * 1.94384);
                    } else {
                      spd = Number(f.attributes.obs[t][i].value);
                    }
                  }
                  else if (f.attributes.obs[t][i].standard == 'wind_direction_from_true_north') { 
                    dir = Number(f.attributes.obs[t][i].value);
                  }
                }
              }
              if (typeof(spd) == 'number' && typeof(dir) == 'number') {
                return 'http://72.44.60.22/glos/icon.php?size=115,115&cpt=0,30&mag=' + Math.round(spd) + '&dir=' + Math.round(dir) + '&barb&noCircle&shadow=white';
              }
              else {
                return '/static/img/blank.png';
              }
            }
          }
        }
      )
    })}
  );
  obs.events.register('featuresadded',this,function(e) {
    for (var i = 0; i < e.features.length; i++) {
      getObs(e.features[i],e.object);
    }
  });

  var ctl = new OpenLayers.Control.SelectFeature(obs,{
    eventListeners : {
      featurehighlighted : function(e) {
        popup(e.feature);
      }
    }
    ,autoActivate  : true
  });

  map = new OpenLayers.Map('map',{
    controls: [
      new OpenLayers.Control.TouchNavigation({
        dragPanOptions: {
          enableKinetic: true
        }
      })
      ,ctl
    ]
    ,layers : [
      new OpenLayers.Layer.Bing({
         type             : 'Aerial'
        ,name             : 'Bing'
        ,key              : 'AhAUXqyQl8MCSgPDlvRf8Dk6fj11yE3qZYcehpG5f7gpea6JVRD9lHCDE8DMawH2'
        ,transitionEffect : 'resize'
      })
      ,obs
    ]
  });

  getStations();

  window.onresize = function(e) {
    if (map.watchObs) {
      updateTimeseries(map.watchObs.station,map.watchObs.obs);
    }
    fixSize();
  }
}

function getStations() {
  var jsonp = new OpenLayers.Protocol.Script();
  jsonp.createRequest(
    '/stations'
    ,{}
    ,function(json) {
      var features = [];
      for (var i = 0; i < json.stations.length; i++) {
        var f = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(json.stations[i].longitude,json.stations[i].latitude).transform(proj4326,proj900913));
        f.attributes = {
           data  : json.stations[i].data
          ,name  : json.stations[i].name
          ,descr : json.stations[i].description
          ,obs   : {}
        };
        features.push(f);
      }
      var l = map.getLayersByName('obs')[0];
      l.addFeatures(features);
      map.zoomToExtent(l.getDataExtent().scale(2));
    }
  );
}

function getObs(f,l) {
  var jsonp = new OpenLayers.Protocol.Script();
  jsonp.createRequest(
    f.attributes.data 
    ,{'format' : 'vars'}
    ,function(json) {
      // cheat! put all sensors under the max(t)
      var availableTimes = [];
      var obsData = [];
      for (var j = 0; j < json.data.length; j++) {
        for (var t in json.data[j]) {
          for (var i = 0; i < json.data[j][t].length; i++) {
            obsData.push(json.data[j][t][i]);
          }
          availableTimes.push(t);
        }
      }
      availableTimes.sort();
      var data = {}
      data[availableTimes[availableTimes.length - 1]] = obsData;

      for (var t in data) {
        for (var i = 0; i < data[t].length; i++) {
          if (mode == "dev") {
            // THIS IS DUMMY DATA!
            if (data[t][i].standard == 'wind_speed') {
              data[t][i].value = Math.round(500 * Math.random() + 1) / 10;
            }
            // THIS IS DUMMY DATA!
            else if (data[t][i].standard == 'wind_direction_from_true_north') {
              data[t][i].value = Math.round(3600 * Math.random() + 1) / 10;
            }
          }

          if (!obs[f.attributes.descr]) {
            obs[f.attributes.descr] = {};
          }
          if (!obs[f.attributes.descr][data[t][i].name]) {
            obs[f.attributes.descr][data[t][i].name] = [];
          }
          obs[f.attributes.descr][data[t][i].name].push(data[t][i].value);
          obs[f.attributes.descr][data[t][i].name] = obs[f.attributes.descr][data[t][i].name].slice(-1 * maxTimeseriesCount);
          if (!times[f.attributes.descr]) {
            times[f.attributes.descr] = {};
          }
          if (!times[f.attributes.descr][data[t][i].name]) {
            times[f.attributes.descr][data[t][i].name] = [];
          }

          if (mode == "dev") {
            // THIS IS DUMMY DATA!
            times[f.attributes.descr][data[t][i].name].push(new Date());
          } else {
            times[f.attributes.descr][data[t][i].name].push(isoDateToDate(t));
          }

          times[f.attributes.descr][data[t][i].name] = times[f.attributes.descr][data[t][i].name].slice(-1 * maxTimeseriesCount);
          updateTimeseries(f.attributes.descr,data[t][i].name);
        }
      }
      f.attributes.obs = data;
      l.redraw();
      if (map.popup && map.popup.name == f.attributes.name) {
        popup(f);
      }
      setTimeout(function(){getObs(f,l)},timeseriesRefreshInterval);
    }
  );
}

function popup(f) {
  var obs = {};
  var html = ['<tr><td colspan=2 align=center><b>' + f.attributes.descr + '</b></td></tr>'];
  for (var t in f.attributes.obs) {
    html.push('<tr><td colspan=2 align=center>' + isoDateToDate(t).format("mmm d, yyyy h:MM:ss tt (Z)") + '</td></tr>');
    for (var i = 0; i < f.attributes.obs[t].length; i++) {
      if (f.attributes.obs[t][i].units == "m/s") {
        ms_value = f.attributes.obs[t][i].value
        knots_value = Math.round(ms_value * 1.94384 * 1000) / 1000;
        obs[f.attributes.obs[t][i].name] = '<tr><td><a href="javascript:watchObs(\'' + f.attributes.descr + '\',\'' + f.attributes.obs[t][i].name + '\')">' + f.attributes.obs[t][i].name + '</a></td><td>' + knots_value + ' knots (' + ms_value + ' ' + f.attributes.obs[t][i].units + ')</td></tr>';
      } else {
        obs[f.attributes.obs[t][i].name] = '<tr><td><a href="javascript:watchObs(\'' + f.attributes.descr + '\',\'' + f.attributes.obs[t][i].name + '\')">' + f.attributes.obs[t][i].name + '</a></td><td>' + f.attributes.obs[t][i].value + ' ' + f.attributes.obs[t][i].units + '</td></tr>';
      }
    }
  }

  var o = [];
  for (var name in obs) {
    o.push(name);
  }
  o.sort();

  for (var i = 0; i < o.length; i++) {
    html.push(obs[o[i]]);
  }

  var centroid = f.geometry.getCentroid();
  map.popup = new OpenLayers.Popup.FramedCloud(
     'popup'
    ,new OpenLayers.LonLat(centroid.x,centroid.y)
    ,null
    ,'<table class="obs" style="width:225px">' + html.join('') + '</table>'
    ,null
    ,true
    ,function() {
      map.removePopup(map.popup);
      map.popup.destroy();
      delete map.popup;
    }
  );
  map.popup.name = f.attributes.name;
  map.addPopup(map.popup,true);
  OpenLayers.Event.observe(map.popup.contentDiv,'touchend',OpenLayers.Function.bindAsEventListener(function(e) {
    OpenLayers.Event.stop(e);
  }));
}

function watchObs(station,obs) {
  map.watchObs = {
     station : station
    ,obs     : obs
  };
  updateTimeseries(station,obs);
}

function updateTimeseries(s,o) {
  if (map.watchObs && map.watchObs.station == s && map.watchObs.obs == o) {
    document.getElementById('timeseriesTitle').style.visibility = 'visible';
    document.getElementById('timeseriesGraph').style.visibility = 'visible';
    document.getElementById('timeseriesFooter').style.visibility = 'visible';

    if (times[s][o][0] != null) {
      document.getElementById('timeseriesTitle').innerHTML = '<table><tr><td>' + o + ' @ ' + s + ' from ' + times[s][o][0].format("mmm d h:MM:ss tt (Z)") + '</td></tr></table>';
    }

    var d = [];
    for (var i = 0; i < obs[s][o].length; i++) {
      d.push([i,Number(new RegExp(/direction/i).test(o) ? 0 : obs[s][o][i])]);
    }
    var p = $.plot(
      $('#timeseriesGraph')
      ,[{
         data        : d
        ,color       : '#8DA0CB'
        ,curvedLines : {show : d.length > 1 && !new RegExp(/direction/i).test(o)}
        ,lines       : {show : false}
      }]
      ,{
         grid   : {backgroundColor : {colors : ['#fff','#eee']},borderWidth : 1,borderColor : '#99BBE8'}
        ,legend : {show : false}
        ,series : {curvedLines : {active : d.length > 1 && !new RegExp(/direction/i).test(o)}}
        ,xaxis  : {
           show : false
          ,min  : new RegExp(/direction/i).test(o) ? -1 : null
          ,max  : new RegExp(/direction/i).test(o) ? d.length : null
        }
        ,yaxis  : {
           min  : (new RegExp(/speed/i).test(o) ? 0 : null)
          ,font : {
             family : 'tahoma,helvetica,sans-serif'
            ,size   : 8
          }
          ,show : !new RegExp(/direction/i).test(o)
        }
      }
    );
    if (new RegExp(/direction/i).test(o)) {
      for (var i = 0; i < obs[s][o].length; i++) {
        var val = Math.round((obs[s][o][i] + 180) % 360);
        var off = p.pointOffset({x : i,y : 0});
        $('#timeseriesGraph').prepend('<div class="dir" style="position:absolute;left:' + (off.left-80/2) + 'px;top:' + (off.top-(80/2)) + 'px;background-image:url(\'http://72.44.60.22/mobex/img/arrows/' + 80 + 'x' + 80 + '.dir' + val + '.' + '7570B3' + '.png\');width:' + 80 + 'px;height:' + 80 + 'px;"></div>');
      }
    }
  }
}

function closeTimeseries() {
  delete map.watchObs;
  document.getElementById('timeseriesTitle').style.visibility = 'hidden';
  document.getElementById('timeseriesGraph').style.visibility = 'hidden';
  document.getElementById('timeseriesFooter').style.visibility = 'hidden';
}

function isoDateToDate(s) {
  // 2010-01-01 00:00:00
  var p = s.split(' ');
  var ymd = p[0].split('-');
  var hm = p[1].split(':');
  return new Date(
     ymd[0]
    ,ymd[1] - 1
    ,ymd[2]
    ,hm[0]
    ,hm[1]
  );
}
