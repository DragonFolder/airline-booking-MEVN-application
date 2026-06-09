<script setup>
import { defineProps } from 'vue';
import { formatPeso } from '../format.js';

const props = defineProps({
  flightData: {
    type: Object,
    required: true,
    default: () => ({
      departureCity: '',
      departureTime: '',
      departureCode: '',
      arrivalCity: '',
      arrivalTime: '',
      arrivalCode: '',
      price: 0
    })
  }
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<template>
  <div class="flight-summary-card">
    <h3 class="summary-title">Flight Summary</h3>
    
    <!-- Departure Segment -->
    <div class="flight-segment">
      <div class="segment-header">
        <span class="badge">Departure</span>
        <span class="city">{{ flightData.departureCity }}</span>
      </div>
      <div class="segment-details">
        <p><strong>Time:</strong> {{ formatDate(flightData.departureTime) }}</p>
        <p><strong>Flight Code:</strong> {{ flightData.departureCode }}</p>
      </div>
    </div>

    <!-- Arrival Segment -->
    <div class="flight-segment">
      <div class="segment-header">
        <span class="badge arrival">Arrival</span>
        <span class="city">{{ flightData.arrivalCity }}</span>
      </div>
      <div class="segment-details">
        <p><strong>Time:</strong> {{ formatDate(flightData.arrivalTime) }}</p>
        <p><strong>Flight Code:</strong> {{ flightData.arrivalCode }}</p>
      </div>
    </div>

    <hr class="divider" />

    <!-- Totals Area -->
    <div class="price-breakdown">
      <div class="price-row">
        <span>Base Fare:</span>
        <span>{{ formatPeso(flightData.price) }}</span>
      </div>
      <div class="price-row total">
        <span>Total Amount Due:</span>
        <span class="total-amount">{{ formatPeso(flightData.price) }}</span>
      </div>
    </div>
  </div>
</template>