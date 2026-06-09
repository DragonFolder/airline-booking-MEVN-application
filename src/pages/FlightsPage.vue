<template>
    <div class="hero-container py-5">
        <div class="container w-100">
            <h1 class="hero-title mb-4">Available Flights</h1>
            <p v-if="isLoading">Loading flights…</p>
            <p v-else-if="errorMsg" class="text-danger">{{ errorMsg }}</p>
            <p v-else-if="!flights.length" class="text-muted">
                No flights found for your search.
            </p>
            <div v-else class="row g-3">
                <div class="col-12" v-for="flight in flights" :key="flight._id">
                    <FlightCard :flight="flight" />
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api.js';
import FlightCard from '../components/FlightCard.vue';

const route = useRoute();

const flights = ref([]);
const isLoading = ref(false);
const errorMsg = ref('');

async function loadFlights() {
    isLoading.value = true;
    errorMsg.value = '';
    try {
        // only include params when present; if none provided, fetch all flights
        const params = {};
        if (route.query.from) params.origin = route.query.from;
        if (route.query.to) params.destination = route.query.to;
        if (route.query.date) params.date = route.query.date;

        const resp = Object.keys(params).length
            ? await api.get('/flights', { params })
            : await api.get('/flights');
        const list = resp.data?.data;
        flights.value = Array.isArray(list) ? list : [];
    } catch (err) {
        console.error('Failed to load flights', err);
        errorMsg.value = 'Could not load flights. Please try again.';
        flights.value = [];
    } finally {
        isLoading.value = false;
    }
}

onMounted(loadFlights);
</script>

