<template>
    <div class="hero-container text-center py-5">
        <h1 class="hero-title mb-2">Your Next Adventures Awaits</h1>
        <p class="hero-subtitle mb-5 mx-auto">
            Experience the art of effortless travel with Skybound's premium global network.
        </p>

        <div class="search-card card p-4 border shadow-sm mx-auto bg-white rounded-4" style="max-width: 800px;">
            <HomeSearchComponent />
        </div>
    </div>
</template>

<script setup>
import HomeSearchComponent from '../components/HomeSearchComponent.vue';
</script>
