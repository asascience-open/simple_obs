# coding: utf8 
import os

LOG_FILE=True

STATIONS =  {
              "PierJ" :   {
                "location" : (-118.185,33.73166666666667),
                "instant" : [
                  os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_j_instant.dat")
                ],
                "history" : [
                  os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_j_wind.dat")
                ],
                "frequency" : 6,
                "description" : "Station on peir J"
              },

              "PierS" :   {
                "location" : (-118.225,33.69333333333333),
                "instant" : [
                  os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_s_instant.dat")
                ],
                "history" : [
                  os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_s_wind.dat")
                ],
                "frequency" : 6,
                "description" : "Station on peir S"
              },

              "PierF" :   {
                "location" : (-118.26666666666667,33.74833333333333),
                "instant" : [
                  os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_f_instant.dat"),
                  os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_f_gust.dat")
                ],
                "history" : [
                  os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_f_met.dat"),
                  os.path.join(os.path.dirname(__file__), "..","tests","resources","pier_f_wind.dat")
                ],
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

            "Speed" : {
              "name"      : "Wind Speed",
              "standard"  : "wind_speed",
              "units"     : "m/s"
            },
            "wind_speed" : {
              "name"      : "Wind Speed",
              "standard"  : "wind_speed",
              "units"     : "m/s"
            },

            "Direction" : {
              "name"      : "Wind Direction",
              "standard"  : "wind_direction_from_true_north",
              "units"     : "°TN" 
            },
            "wind_direc" : {
              "name"      : "Wind Direction",
              "standard"  : "wind_direction_from_true_north",
              "units"     : "°TN" 
            },

            "Gust" : {
              "name"      : "Wind Gust",
              "standard"  : "wind_gust",
              "units"     : "m/s"
            },
            "wind_gust" : {
              "name"      : "Wind Gust",
              "standard"  : "wind_gust",
              "units"     : "m/s"
            },

            "AirTemp" : {
              "name"      : "Air Temperature",
              "standard"  : "air_temperature",
              "units"     : "°C"
            },
            "air_temp" : {
              "name"      : "Air Temperature",
              "standard"  : "air_temperature",
              "units"     : "°C"
            },

            "RelativeHumidity" : {
              "name"      : "Relative Humidity",
              "standard"  : "relative_humidity",
              "units"     : "%"     
            },
            "rh" : {
              "name"      : "Relative Humidity",
              "standard"  : "relative_humidity",
              "units"     : "%"
            },

            "AtmPressure" : {
              "name"      : "Barometric Pressure",
              "standard"  : "air_pressure",
              "units"     : "mbar"
            },
            "bp" : {
              "name"      : "Barometric Pressure",
              "standard"  : "air_pressure",
              "units"     : "mbar"
            },

            "dew_point" : {
              "name"      : "Dew Point",
              "standard"  : "dew_point",
              "units"     : "°C"
            }

          }