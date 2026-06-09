import './assets/main.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.min.css';

import 'notyf/notyf.min.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createRouter, createWebHistory } from 'vue-router';

//Pages
import ErrorPage from './pages/ErrorPage.vue';
import HomePage from './pages/HomePage.vue';
import LoginPage from './pages/LoginPage.vue';
import RegisterPage from './pages/RegisterPage.vue';
import FlightsPage from './pages/FlightsPage.vue';
import PaymentPage from './pages/PaymentPage.vue';
import BookingPage from './pages/BookingPage.vue';
import LogoutPage from './pages/LogoutPage.vue';
import MyBookingPage from './pages/MyBookingPage.vue';

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'Home',
			component: HomePage
		},
		{
			path: '/register',
			name: 'Register',
			component: RegisterPage
		},
		{
			path: '/login',
			name: 'Login',
			component: LoginPage
		},
		{
			path: '/flights',
			name: 'Flights',
			component: FlightsPage
		},
		{
			path: '/booking',
			name: 'Booking',
			component: BookingPage
		},
		{
			path: '/my-booking',
			name: 'MyBooking',
			component: MyBookingPage
		},
		{
			path: '/logout',
			name: 'Logout',
			component: LogoutPage
		},
		{
			path: '/checkout/:id',
			name: 'Payment',
			component: PaymentPage
		},
		{
			path: '/:catchAll(.*)',
			name: 'NotFound',
			component: ErrorPage
		}
	]
});

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
