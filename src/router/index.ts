// Composables
import { createRouter, createWebHistory } from "vue-router"

import Settings from "@/views/Settings.vue"
import Flight from "@/views/Flight.vue"
import Airport from "@/views/Airport.vue"
import FIR from "@/views/FIR.vue"
import UIR from "@/views/UIR.vue"
import Country from "@/views/Country.vue"
import Member from "@/views/Member.vue"

const routes = [
    {
        path: "/",
        component: () => import("@/layouts/default/Default.vue"),
        children: [
            {
                path: "",
                name: "Home",
                // route level code-splitting
                // this generates a separate chunk (Home-[hash].js) for this route
                // which is lazy-loaded when the route is visited.
                component: () => import("@/views/Home.vue"),
            },
            {
                path: "settings",
                component: Settings,
            },
            {
                path: "flight/:id",
                component: Flight,
            },
            {
                path: "airport/:id",
                component: Airport,
            },
            {
                path: "fir/:id",
                component: FIR,
            },
            {
                path: "uir/:id",
                component: UIR,
            },
            {
                path: "country/:id",
                component: Country,
            },
            {
                path: "member/:id",
                component: Member,
            }
        ],
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
})

export default router
