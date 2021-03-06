from flask import url_for, request, redirect, jsonify, render_template, redirect, make_response
from simple_obs import app
import simple_obs.utils as utils
import csv
import os
from dateutil.parser import parse

@app.route('/', methods=['GET'])
def index():
  return render_template("index.html")

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
    format = request.args.get("format", "rows")
    records = request.args.get("records", None)

    if records is None:
        data_paths = filter(None, station_data.get("instant", None))
        records = 1
    else:
        data_paths = filter(None, station_data.get("history", None))
        records = int(records)

    data = get_data(data_paths, records, format)
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

def get_data(filenames, records, format):
    
    output = []

    if not isinstance(filenames, list):
        filenames = [filenames]

    for filename in filenames:

        if not os.path.exists(filename):
            continue

        header = None
        data = []

        try:
            with open(filename) as f:
                header = f.readline()
                header = f.readline().replace("\"", "").replace("\n","").split(",")
                data = utils.tail(f, records)
        except:
            app.logger.warn("Can't find file: %s" % filename)

        newd = []
        for d in data:
            try:
                d = d.replace("\"", "").split(",")
                assert d[0] != ''
                date = parse(d[0])
                newd.append(d)
            except:
                continue

        data = newd

        if format == "vars":
            var = get_var_data(header, data)
            for v in var:
                found = False
                for x in output:
                    if x.keys()[0] == v.keys()[0]:
                        x[x.keys()[0]] += v[x.keys()[0]]
                        found = True
                        break
                if not found:
                    output.append(v)
            # Sort by datetime
            output.sort(key=lambda x: x.keys()[0])
        else:
            output.append(get_row_data(header, data))

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

    