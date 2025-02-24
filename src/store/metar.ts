import { defineStore } from "pinia"
import { reactive, ref } from "vue"
import { v4 as uuid } from "uuid"
import axios from "axios"
import { parseMetar } from "metar-taf-parser"
import { apiBaseUrl } from "./vatsim"
import moment from "moment"

export const useMetarStore = defineStore("metar", () => {
    const time = ref("")
    const metar = reactive({} as { [key: string]: string })
    const subscriptions = reactive({} as { [key: string]: string })
    const lastFetch = ref(0)

    const parse = (icao: string) => (icao in metar && !metar[icao].includes("Loading") ? parseMetar(metar[icao]) : undefined)

    let fetchOnSubscribeTimeout: any = undefined
    function subscribe(icao: string) {
        const subscriptionId = uuid()
        subscriptions[subscriptionId] = icao
        if (!(icao in metar)) {
            metar[icao] = `${icao} Loading...`
            if (fetchOnSubscribeTimeout) clearTimeout(fetchOnSubscribeTimeout)
            fetchOnSubscribeTimeout = setTimeout(() => {
                fetchOnSubscribeTimeout = undefined
                fetch()
            }, 500)
        }
        return subscriptionId
    }

    function unsubscribe(subscription: string) {
        if (subscription in subscriptions) {
            const icao = subscriptions[subscription]
            delete subscriptions[subscription]
            if (!Object.values(subscriptions).includes(icao)) {
                delete metar[icao]
            }
        }
    }

    function fetch() {
        if (Object.values(subscriptions).length == 0) return
        lastFetch.value = Date.now()
        const airports = [...new Set(Object.values(subscriptions))]
        const icaos = airports.join(",")
        console.log(`Fetch metar`, icaos)
        axios.get(`${apiBaseUrl}/metar/${icaos}`).then((response) => {
            for (const line of response.data.trim().split("\n")) {
                const icao = line.split(" ")[0]
                metar[icao] = line
            }
            lastFetch.value = Date.now()
            time.value = moment().utc().toISOString()
        })
    }

    if ((window as any).metarRefreshInterval) clearInterval((window as any).metarRefreshInterval)
    ;(window as any).metarRefreshInterval = setInterval(() => {
        if (Date.now() - lastFetch.value > 180000) fetch()
    }, 1000)

    return {
        time,
        metar,
        parse,
        subscribe,
        unsubscribe,
        fetch,
    }
})
