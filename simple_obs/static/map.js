var map;
// switch this to 'dev' to get random data
var mode = "";

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
                    spd = String(f.attributes.obs[t][i].value + ' ' + f.attributes.obs[t][i].units);
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
                    spd = Number(f.attributes.obs[t][i].value);
                  }
                  else if (f.attributes.obs[t][i].standard == 'wind_direction_from_true_north') { 
                    dir = Number(f.attributes.obs[t][i].value);
                  }
                }
              }
              if (typeof(spd) == 'number' && typeof(dir) == 'number') {
                return 'http://explorer.glos.us/icon.php?size=115,115&cpt=0,30&mag=' + Math.round(spd) + '&dir=' + Math.round(dir) + '&barb&noCircle&shadow=white';
              }
              else {
                return '/img/blank.png';
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
       new OpenLayers.Control.Attribution()
      ,new OpenLayers.Control.TouchNavigation({
        dragPanOptions: {
          enableKinetic: true
        }
      })
      ,new OpenLayers.Control.Zoom()
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
      if (mode == "dev") {
        for (var t in json.data[0]) {
          for (var i = 0; i < json.data[0][t].length; i++) {
            if (json.data[0][t][i].standard == 'wind_speed') {
              json.data[0][t][i].value = Math.round(500 * Math.random() + 1) / 10;
            }
            else if (json.data[0][t][i].standard == 'wind_direction_from_true_north') {
              json.data[0][t][i].value = Math.round(3600 * Math.random() + 1) / 10;
            }
          }
        }
      }
      f.attributes.obs = json.data[0];
      l.redraw();
      if (map.popup && map.popup.name == f.attributes.name) {
        popup(f);
      }
      setTimeout(function(){getObs(f,l)},5000);
    }
  );
}

function popup(f) {
  var obs = {};
  var html = ['<tr><td colspan=2 align=center><b>' + f.attributes.descr + '</b></td></tr>'];
  for (var t in f.attributes.obs) {
    html.push('<tr><td colspan=2 align=center>' + t + '</td></tr>');
    for (var i = 0; i < f.attributes.obs[t].length; i++) {
      obs[f.attributes.obs[t][i].name] = '<tr><td><a href="javascript:alert(1)">' + f.attributes.obs[t][i].name + '</a></td><td>' + f.attributes.obs[t][i].value + ' ' + f.attributes.obs[t][i].units + '</td></tr>';
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
    ,'<table class="obs" style="width:200px">' + html.join('') + '</table>'
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