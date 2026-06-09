<template>
    <div class="card shadow-sm">
        <div class="card-body">
            <div class="row align-items-center g-3">
                <!-- Airline / flight number -->
                <div class="col-12 col-lg-3">
                    <div class="fw-bold">{{ flight.airline }}</div>
                    <small class="text-muted">
                        <i class="bi bi-airplane-fill me-1"></i>Flight No. {{ flight.flight_number }}
                    </small>
                </div>

                <!-- Route -->
                <div class="col-12 col-lg-5">
                    <div class="d-flex align-items-center text-center">
                        <div>
                            <div class="fs-4 fw-bold">{{ flight.origin_code }}</div>
                            <small class="text-muted">{{ flight.origin_city }}</small>
                            <small class="text-muted d-block">{{ formatTime(flight.departure_time) }}</small>
                        </div>
                        <div class="flex-grow-1 px-3">
                            <small class="text-muted d-block mb-1">{{ formatDuration(flight.duration_minutes) }}</small>
                            <hr class="m-0" />
                        </div>
                        <div>
                            <div class="fs-4 fw-bold">{{ flight.destination_code }}</div>
                            <small class="text-muted">{{ flight.destination_city }}</small>
                            <small class="text-muted d-block">{{ formatTime(flight.arrival_time) }}</small>
                        </div>
                    </div>
                </div>

                <!-- Price -->
                <div class="col-6 col-lg-2 text-lg-center">
                    <span class="badge bg-primary fs-6">{{ formatPeso(flight.price) }}</span>
                </div>

                <!-- Action -->
                <div class="col-6 col-lg-2 d-flex justify-content-end">
                    <template v-if="isLoggedIn">
                        <router-link :to="{ name: 'Booking', query: { flight: flight._id } }" class="btn btn-sm btn-primary">
                            Book
                        </router-link>
                    </template>
                    <template v-else>
                        <button type="button" class="btn btn-sm btn-outline-secondary" @click.prevent="router.push({ name: 'Login' })" title="Login to book">
                            Login to book
                        </button>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGlobalStore } from '../stores/global';
import { formatPeso } from '../format.js';

defineProps({
    flight: {
        type: Object,
        required: true
    }
});

const router = useRouter();
const store = useGlobalStore();
const isLoggedIn = computed(() => !!store.user.token);

function formatTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function formatDuration(minutes) {
    if (minutes == null) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}
</script>
