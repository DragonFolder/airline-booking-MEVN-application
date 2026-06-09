<script setup>
import { ref, reactive, computed, defineEmits, defineProps } from 'vue';

const props = defineProps({
  processing: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit-payment']);

// max date validator
const maxBirthDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

// ui mock state for card details not sent to db
const cardDetails = reactive({
  name: '',
  number: '',
  expiry: '',
  cvv: ''
});

// model checker
const formData = reactive({
  passenger: {
    first_name: '',
    last_name: '',
    date_of_birth: '',
    passport_number: ''
  },
  card_last_four: ''
});

const handleSubmit = () => {
  // to save the last 4 digits only
  formData.card_last_four = cardDetails.number.slice(-4);
  emit('submit-payment', { ...formData });
};
</script>


<!-- MOCK UI -->
<template>
  <div class="payment-form-card">
    <h2 class="form-title">Passenger & Payment Details</h2>
    <form @submit.prevent="handleSubmit">
      
      <!-- Passenger Schema Fields -->
      <h3 class="section-title">Passenger Information</h3>
      <div class="form-group row">
        <div>
          <label>First Name</label>
          <input type="text" v-model="formData.passenger.first_name" required placeholder="John" />
        </div>
        <div>
          <label>Last Name</label>
          <input type="text" v-model="formData.passenger.last_name" required placeholder="Doe" />
        </div>
      </div>

      <div class="form-group row">
        <div>
          <label>Date of Birth</label>
          <input type="date" v-model="formData.passenger.date_of_birth" :max="maxBirthDate" required />
        </div>
        <div>
          <label>Passport Number</label>
          <input type="text" v-model="formData.passenger.passport_number" required placeholder="A1234567" class="uppercase" />
        </div>
      </div>

      <hr class="divider" />

      <!-- Local Payment Interaction Fields -->
      <h3 class="section-title">Credit Card Payment</h3>
      <div class="form-group">
        <label>Cardholder Name</label>
        <input type="text" v-model="cardDetails.name" required placeholder="JOHN DOE" />
      </div>

      <div class="form-group">
        <label>Card Number</label>
        <input type="text" v-model="cardDetails.number" maxlength="16" pattern="\d{16}" required placeholder="4111222233334444" />
      </div>

      <div class="form-group row">
        <div>
          <label>Expiration Date</label>
          <input type="text" v-model="cardDetails.expiry" maxlength="5" placeholder="MM/YY" required />
        </div>
        <div>
          <label>CVV</label>
          <input type="password" v-model="cardDetails.cvv" maxlength="3" pattern="\d{3}" required placeholder="123" />
        </div>
      </div>

      <button type="submit" class="submit-btn" :disabled="processing">
        {{ processing ? 'Processing Payment...' : 'Confirm & Pay' }}
      </button>
    </form>
  </div>
</template>