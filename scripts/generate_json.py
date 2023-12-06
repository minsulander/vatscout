#!/usr/bin/env python

import os
import json

txtfile = os.path.join(os.path.dirname(__file__), '..', 'data','ICAO_Airlines.txt')
callsigns = {}
count = 0
with open(txtfile, encoding="cp1252") as file:
    for line in file:
        line = line.strip()
        if line.startswith(";"): continue
        (prefix, airline, callsign, country) = line.split("\t")
        callsigns[prefix] = callsign
        count += 1

outfile = os.path.join(os.path.dirname(__file__), '..', 'src', 'data','callsigns.json')
with open(outfile, "w") as file: json.dump(callsigns, file)

print(f"Generated {count} callsigns")


txtfile = os.path.join(os.path.dirname(__file__), '..', 'data','ICAO_Aircraft.txt')
count = 0
actypecodes = {}
actypenames = {}
with open(txtfile, encoding="cp1252") as file:
    prev = None
    for line in file:
        line = line.strip()
        if line.startswith(";"): continue
        try:
            (icao, typecode, manufacturer, model) = line.split("\t")
            actypecodes[icao] = typecode
            if manufacturer == "-":
                actypenames[icao] = model
            else:
                actypenames[icao] = f"{manufacturer} {model}"
            count += 1
            prev = icao
        except ValueError as e:
            if prev: actypenames[prev] += f" {line}"

outfile = os.path.join(os.path.dirname(__file__), '..', 'src', 'data','actypecodes.json')
with open(outfile, "w") as file: json.dump(actypecodes, file)

outfile = os.path.join(os.path.dirname(__file__), '..', 'src', 'data','actypenames.json')
with open(outfile, "w") as file: json.dump(actypenames, file)

print(f"Generated {count} actypes")