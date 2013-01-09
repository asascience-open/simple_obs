from flask import url_for, request, redirect, jsonify
from simple_obs import app
import simple_obs.utils as utils
import csv
import os
from dateutil.parser import parse

@app.route('/stations', methods=['GET'])
@utils.jsonp
def stations():
    paths = app.config.get("STATIONS")

    stats = []

    for k in paths:
        st = {}
        st["longitude"] = paths[k].get("location")[0]
        st["latitude"] = paths[k].get("location")[1]
        st["name"] = k
        st["description"] = paths[k].get("description")
        st["data"] = url_for("data", station_id=k)
        stats.append(st)

    return jsonify({"stations" : stats })

@app.route('/query/<string:station_id>', methods=['GET'])
@utils.jsonp
def data(station_id):

    station_data = get_station_data(station_id)
    if station_data is None:
        return jsonify({"error" : "No station found with name %s" % station_id })

    data_path = None
    starting = request.args.get("starting", None)
    ending = request.args.get("ending", None)

    rows = 10
    if starting is None and ending is None:
        data_path = station_data.get("instant")
        rows = 1
    else:
        data_path = station_data.get("historic")
        starting = parse(starting)
        ending = parse(ending)
        rows = int(abs((ending - starting).total_seconds()) / 60 / station_data.get("frequency"))
        
    format = request.args.get("format", "rows")

    data = get_data(data_path, rows, format, starting, ending)
    return jsonify({"data" : data })

def get_station_data(station_id):
    paths = app.config.get("STATIONS")
    stat = paths.get(station_id, None)
    return stat

def get_row_data(header, data):

    names, standards, units = get_header(header) 

    output = {}

    for t in data:
        ds = []
        for x in range(len(t)):
            nm = "%s (%s)" % (names[x], units[x])
            if names[x] is not None:
                try:
                    output[nm]
                except:
                    output[nm] = []
                output[nm].append(t[x])

    return output

def get_var_data(header, data):

    names, standards, units = get_header(header)

    output = []
    for t in data:
        ds = []
        for x in range(len(t)):
            if names[x] is not None and standards[x] != "time":
                d = {}
                d["value"] = t[x]
                d["name"] = names[x]
                d["standard"] = standards[x]
                d["units"] = units[x]
                ds.append(d)

        output.append({ t[0] : ds })

    return output

def get_data(filename, rows, format, starting, ending):
    header = None
    with open(filename) as f:
        header = f.readline()
        header = f.readline().replace("\"", "").replace("\n","").split(",")
        data = utils.tail(f, rows)

    newd = []
    for d in data:
        try:
            d = d.replace("\"", "").split(",")
            assert d[0] != ''
            date = parse(d[0])
            if starting is not None and ending is not None:
                if date > starting and date < ending:
                    newd.append(d) 
            else:
                newd.append(d)
        except:
            continue

    data = newd

    if format == "vars":
        output = get_var_data(header, data)
    else:
        output = get_row_data(header, data)

    return output

def get_header(header):

    names = []
    standards = []
    units = []

    vs = app.config.get("VAR_MAP")

    for col in header:
        name = None
        standard = None
        unit = None

        d = vs.get(col, None)
        if d is not None:
            name = d.get("name", None)
            standard = d.get("standard", None)
            unit = d.get("units", None)

        names.append(name)
        standards.append(standard)
        units.append(unit)

    return names, standards, units

    