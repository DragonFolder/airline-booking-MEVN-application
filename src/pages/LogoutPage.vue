<template>
  <div class="container py-5">
    <h3>Logging out…</h3>
    <p class="text-muted">You will be redirected shortly.</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGlobalStore } from '../stores/global.js';

const router = useRouter();
const store = useGlobalStore();

onMounted(async () => {
  try {
    localStorage.removeItem('token');
  } catch (e) {}
  try {
    await store.getUserDetails(null);
  } catch (e) {
    // ignore
  }
  router.push({ name: 'Home' });
});
</script>
