<template>
  <div class="container py-5">
    <h1 class="mb-4">My Booking</h1>

    <p v-if="loading">Loading…</p>
    <p v-else-if="error" class="text-danger">{{ error }}</p>

    <div v-else>
      <p v-if="!bookings.length">You have no bookings.</p>

      <div v-for="b in bookings" :key="b._id" class="card mb-3" :class="{ 'departed-booking': hasDeparted(b) }">
        <!-- Clickable summary header (always visible) -->
        <button
          type="button"
          class="card-header bg-transparent w-100 border-0 text-start d-flex justify-content-between align-items-center gap-2"
          :class="{ 'border-bottom': isOpen(b) }"
          :aria-expanded="isOpen(b)"
          @click="toggle(b._id)"
        >
          <span class="d-flex align-items-center gap-2 text-truncate">
            <i class="bi" :class="isOpen(b) ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
            <strong v-if="b.flight_id">{{ b.flight_id.flight_number }} — {{ b.flight_id.origin_code }} → {{ b.flight_id.destination_code }}</strong>
            <strong v-else>{{ b.booking_reference }}</strong>
            <span v-if="b.flight_id" class="text-muted small">{{ formatTime(b.flight_id.departure_time) }}</span>
          </span>
          <span class="flex-shrink-0">
            <span v-if="hasDeparted(b)" class="badge bg-secondary me-1">Departed</span>
            <span class="badge" :class="statusClass(b.status)">{{ b.status }}</span>
          </span>
        </button>

        <!-- Collapsible detail -->
        <div v-show="isOpen(b)">
          <div class="card-body">
            <p class="mb-1"><strong>Ref:</strong> {{ b.booking_reference }}</p>
            <p class="mb-1"><strong>Flight:</strong>
              <span v-if="b.flight_id">{{ b.flight_id.flight_number }} — {{ b.flight_id.origin_city }} ({{ b.flight_id.origin_code }}) → {{ b.flight_id.destination_city }} ({{ b.flight_id.destination_code }})</span>
              <span v-else>—</span>
            </p>
            <p class="mb-1"><strong>Departure:</strong> {{ b.flight_id ? formatTime(b.flight_id.departure_time) : '—' }}</p>
            <p class="mb-1"><strong>Arrival:</strong> {{ b.flight_id ? formatTime(b.flight_id.arrival_time) : '—' }}</p>
            <p class="mb-1"><strong>Status:</strong> {{ b.status }}</p>
            <p class="mb-1"><strong>Price:</strong> {{ displayPrice(b) }}</p>
          </div>
          <!-- Departed flights can't be paid/cancelled, so no actions -->
          <div class="card-footer d-flex gap-2" v-if="!hasDeparted(b)">
            <router-link v-if="b.status !== 'Confirmed'" :to="{ name: 'Payment', params: { id: b._id } }" class="btn btn-primary btn-sm">Pay / Complete</router-link>
            <button v-if="b.status !== 'Cancelled'" class="btn btn-outline-danger btn-sm" @click="cancel(b)">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js';
import { useGlobalStore } from '../stores/global.js';
import { formatPeso } from '../format.js';

const router = useRouter();
const store = useGlobalStore();

const bookings = ref([]);
const loading = ref(false);
const error = ref('');
// per-booking open/closed state, keyed by booking id
const expanded = reactive({});

function formatTime(value){
  if(!value) return '—';
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function displayPrice(b){
  if(b.transaction && b.transaction.amount) return formatPeso(b.transaction.amount);
  if(b.flight_id && b.flight_id.price) return formatPeso(b.flight_id.price);
  return '—';
}

function hasDeparted(b){
  return !!(b.flight_id && b.flight_id.departure_time
    && new Date(b.flight_id.departure_time).getTime() < Date.now());
}

function isOpen(b){
  return !!expanded[b._id];
}

function toggle(id){
  expanded[id] = !expanded[id];
}

function statusClass(status){
  if(status === 'Confirmed') return 'bg-success';
  if(status === 'Pending') return 'bg-warning text-dark';
  return 'bg-secondary';
}

async function cancel(booking){
  if(!booking || !booking._id) return;
  try{
    await api.patch(`/bookings/${booking._id}/cancel`);
    // remove from local list
    bookings.value = bookings.value.filter(b => b._id !== booking._id);
  } catch (err){
    console.error(err);
    error.value = err?.response?.data?.message || 'Could not cancel booking.';
  }
}

async function loadBookings(){
  loading.value = true;
  error.value = '';
  try{
    const { data } = await api.get('/bookings');
    const list = data.data || [];
    // hide cancelled bookings from the user view
    bookings.value = Array.isArray(list) ? list.filter(b => (b.status || '').toLowerCase() !== 'cancelled') : [];
    // departed flights start collapsed; upcoming ones start expanded
    bookings.value.forEach(b => { expanded[b._id] = !hasDeparted(b); });
  } catch (err) {
    if(err?.response?.status === 401){
      router.push({ name: 'Login' });
      return;
    }
    if(err?.response?.status === 404){
      bookings.value = [];
      return;
    }
    error.value = err?.response?.data?.message || 'Could not load bookings.';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if(!store.user?.token){
    router.push({ name: 'Login' });
    return;
  }
  await loadBookings();
});
</script>
