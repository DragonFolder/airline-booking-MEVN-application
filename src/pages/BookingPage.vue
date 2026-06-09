<template>
    <div class="container py-5">
        <h1 class="mb-4">Booking</h1>

        <p v-if="isLoading">Loading…</p>
        <p v-else-if="errorMsg" class="text-danger">{{ errorMsg }}</p>

        <div v-if="flight" class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">{{ flight.flight_number }} — {{ flight.origin_city }} ({{ flight.origin_code }}) → {{ flight.destination_city }} ({{ flight.destination_code }})</h5>
                <p class="mb-1"><strong>Departure:</strong> {{ formatTime(flight.departure_time) }}</p>
                <p class="mb-1"><strong>Arrival:</strong> {{ formatTime(flight.arrival_time) }}</p>
                <p class="mb-1"><strong>Duration:</strong> {{ formatDuration(flight.duration_minutes) }}</p>
                <p class="mb-1"><strong>Price:</strong> {{ formatPeso(flight.price) }}</p>
            </div>
        </div>

        <div v-if="flight" class="d-flex align-items-center gap-2">
            <button class="btn btn-primary" :disabled="submitting || !isLoggedIn" @click="confirmBooking">Confirm Booking</button>
            <button type="button" class="btn btn-link" @click="goReplace">Choose a different flight</button>
        </div>
        <p v-if="flight && !isLoggedIn" class="text-muted small mt-2">You must be logged in to book.</p>

        <p v-if="successMsg" class="text-success mt-3">{{ successMsg }}</p>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api.js';
import { useGlobalStore } from '../stores/global.js';
import { formatPeso } from '../format.js';

const route = useRoute();
const router = useRouter();

const flight = ref(null);
const isLoading = ref(false);
const submitting = ref(false);
const errorMsg = ref('');
const successMsg = ref('');
const store = useGlobalStore();
const isLoggedIn = computed(() => !!store.user.token);

function formatTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDuration(minutes) {
    if (minutes == null) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

async function loadFlight(id) {
    if(!id) return;
    try{
        const { data } = await api.get(`/flights/${id}`);
        // standard envelope: { success, message, data }
        flight.value = data.data;
    } catch(err){
        console.error(err);
        errorMsg.value = 'Unable to load flight details.';
    }
}

async function confirmBooking(){
    if(!flight.value) return;
    if(!isLoggedIn.value){
        errorMsg.value = 'You must be logged in to create a booking.';
        router.push({ name: 'Login' });
        return;
    }
    submitting.value = true;
    errorMsg.value = '';
    try{
        const { data } = await api.post('/bookings', { flight_id: flight.value._id });
        successMsg.value = data.message || 'Booking created';
        // redirect to payment page with booking id
        router.push({ name: 'Payment', params: { id: data.data._id } });
    } catch(err){
        console.error(err);
        // surfaces e.g. the schedule-conflict message from the API
        errorMsg.value = err?.response?.data?.message || 'Booking failed. Please try again.';
    } finally{
        submitting.value = false;
    }
}

async function goReplace(){
    // navigate user back to flights search so they can pick another flight
    router.push({ name: 'Flights' });
}

onMounted(async () => {
    isLoading.value = true;
    const flightId = route.query.flight || route.params.id;
    await loadFlight(flightId);
    isLoading.value = false;
});
</script>
