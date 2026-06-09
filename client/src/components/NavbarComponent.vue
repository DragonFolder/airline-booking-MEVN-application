<template>
  <nav class="navbar navbar-expand-lg navbar-dark shadow-sm custom-navbar">
    <div class="container">
      <router-link :to="{ name: 'Home'}" class="navbar-brand brand-logo">SPRINT AIRLINES</router-link>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
        <div class="navbar-nav ms-auto">
          <router-link :to="{ name: 'Flights' }" class="nav-link" >Flights</router-link>
          <template v-if="!isLoggedIn">
            <router-link :to="{ name: 'Register' }" class="nav-link">Register</router-link>
            <router-link :to="{ name: 'Login' }" class="nav-link">Login</router-link>
          </template>
          <template v-else>
            <router-link :to="{ name: 'MyBooking' }" class="nav-link">My Booking</router-link>
            <router-link :to="{ name: 'Logout' }" class="nav-link">Logout</router-link>
          </template>

        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useGlobalStore } from '../stores/global.js';

const store = useGlobalStore();
const isLoggedIn = computed(() => !!store.user?.token);
</script>
