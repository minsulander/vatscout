// Utilities
import { defineStore } from "pinia"
import { ref, reactive } from "vue"
import axios from "axios"

export const useVatsimStore = defineStore("vatsim", () => {
  const data = ref({} as any)
  const spy = ref({} as any)

  console.log("wassup vatsim store")

  async function getData() {
    const response = await axios.get("https://data.vatsim.net/v3/vatsim-data.json")
    data.value = response.data
  }

  async function getSpy() {
    const response = await axios.get("https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/VATSpy.dat")
    console.log("vatspy", response)
    let section = ""
    const spydata = { countries: [], airports: [], firs: [], uirs: [] } as any
    for (const line of response.data.replaceAll("\r","").split("\n")) {
      if (line.startsWith(";")) {
        // comment line
      } else if (line.startsWith("[")) {
        section = line.substring(1, line.length-1).toLowerCase()
        console.log("Section", section)
      } else if (section == "countries") {
        const cols = line.split("|")
        const country = {
          name: cols[0],
          prefix: cols[1],
          facility: cols[2]
        }
        spydata.countries.push(country)
      } else if (section == "airports") {
        // ;ICAO|Airport Name|Latitude Decimal|Longitude Decimal|IATA/LID|FIR|IsPseudo
        const cols = line.split("|")
        const airport = {
          icao: cols[0],
          name: cols[1],
          latitude: parseFloat(cols[2]),
          longitude: parseFloat(cols[3]),
          iata: cols[4],
          fir: cols[5],
          pseudo: cols[6] == "1"
        }
        spydata.airports.push(airport)
      } else if (section == "firs") {
        // ;ICAO|NAME|CALLSIGN PREFIX|FIR BOUNDARY
        const cols = line.split("|")
        const fir = {
          icao: cols[0],
          name: cols[1],
          callsignPrefix: cols[2],
          firBoundary: cols[3]
        }
        spydata.firs.push(fir)
      } else if (section == "uirs") {
        const cols = line.split("|")
        const uir = {
          id: cols[0],
          name: cols[1],
          firBoundaries: cols[2]
        }
        spydata.uirs.push(uir)
      } else if (section == "idl") {
      } else {
        console.log("wut?", section, line)
      }
    }
    spy.value = spydata
  }

  getData()

  return { data, spy, getData, getSpy }
})
