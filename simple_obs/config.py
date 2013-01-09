# coding: utf8 
import os

LOG_FILE=True

STATIONS =  {
              "PierJ" :   {
                "location" : (-70,46),
                "instant" : os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_j_instant.dat"),
                "historic" : os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_j_historic.dat"),
                "frequency" : 6,
                "description" : "Station on peir J"
              },

              "PierS" :   {
                "location" : (-71,46),
                "instant" : os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_s_instant.dat"),
                "historic" : os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_s_historic.dat"),
                "frequency" : 6,
                "description" : "Station on peir S"
              },

              "PierF" :   {
                "location" : (-70,45),
                "instant" : os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_f_instant.dat"),
                "historic" : os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_f_historic.dat"),
                "frequency" : 6,
                "description" : "Station on peir F"
              }
            }


VAR_MAP = {
            "TIMESTAMP" : {
              "name"      : "Datetime",
              "standard"  : "time",
              "units"     : "Eastern"
            },

            "windspeed" : {
              "name"      : "Wind Speed",
              "standard"  : "wind_speed",
              "units"     : "m/s"
            },

            "winddir" : {
              "name"      : "Wind Direction",
              "standard"  : "wind_direction_from_true_north",
              "units"     : "°TN" 
            },

            "AirTemp" : {
              "name"      : "Air Temperature",
              "standard"  : "air_temperature",
              "units"     : "°C"
            },

            "RH" : {
              "name"      : "Relative Humidity",
              "standard"  : "relative_humidity",
              "units"     : "%"
            },

            "bp" : {
              "name"      : "Barometric Pressure",
              "standard"  : "air_pressure",
              "units"     : "mbar"
            }
          }