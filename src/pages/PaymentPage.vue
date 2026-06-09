<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PaymentComponent from '../components/PaymentComponent.vue';
import PaymentFlightComponent from '../components/PaymentFlightComponent.vue';
import api from '../api.js';
import { Notyf } from 'notyf'

const route = useRoute();
const isSubmitting = ref(false);
const isLoading = ref(true);
const bookingId = ref('');
const notyf = new Notyf();

const activeFlight = ref({
    id: '',
    departureCity: '', 
    departureTime: '', 
    departureCode: '',
    arrivalCity: '', 
    arrivalTime: '', 
    arrivalCode: '', 
    price: 0
});

onMounted(async () => {
  try {
    bookingId.value = route.params.id;
    const { data } = await api.get(`/bookings/${bookingId.value}`);
    const booking = data.data;
    const flight = booking.flight_id;

    activeFlight.value = {
        id: flight?._id,
        departureCity: flight?.origin_city,
        departureTime: flight?.departure_time,
        departureCode: flight?.origin_code,
        arrivalCity: flight?.destination_city, 
        arrivalTime: flight?.arrival_time,
        arrivalCode: flight?.destination_code,
        price: flight?.price
    };
  } catch (err) {
    notyf.alert("Failed to load booking details.");
  } finally {
    isLoading.value = false;
  }
});

const handleCheckoutSubmit = async (payload) => {
  isSubmitting.value = true;
  try {
    await api.post(`/payment/${bookingId.value}`, {
      status: "Confirmed",
      passenger: payload.passenger,
      transaction: {
        amount: activeFlight.value.price,
        card_last_four: payload.card_last_four,
        payment_status: "approved"
      }
    });
    notyf.success("Payment successful! Booking confirmed.");
  } catch (err) {
    notyf.error(err.response?.data?.message || "Error in processing payment.");
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<!-- MOCK UI -->
<template>
<div class="hero-container">
  <div class="checkout-container">
    <div v-if="isLoading" class="status-msg">Loading...</div>
    
    <template v-else>
      <div class="payment-main">
        <PaymentComponent :processing="isSubmitting" @submit-payment="handleCheckoutSubmit" />
      </div>
      <div class="payment-sidebar">
        <PaymentFlightComponent :flightData="activeFlight" />
      </div>
    </template>
  </div>
 </div> 
</template>