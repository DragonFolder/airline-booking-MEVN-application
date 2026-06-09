import { defineStore } from 'pinia';
import { reactive } from 'vue';

import api from '../api';
//defineStore() creates a store. It has 2 arguments, the unique id of the store and the function that defines and returns the states and actions of the store.
export const useGlobalStore = defineStore('global', () => {

	let user = reactive({
		token: localStorage.getItem('token'),
		email: null,
		isAdmin: null
	})

	async function getUserDetails(token) {
		
		if(!token) {
			user.token = null;
			user.email = null;
			user.isAdmin = null;

			return
		}

		try {
			const { data } = await api.get('/auth/me');
			const profile = data.data || {};

			user.token = token;
			user.email = profile.email || profile.full_name || null;
			user.isAdmin = (profile.role === 'admin');
		} catch (err) {
			// clear any partially set state
			user.token = null;
			user.email = null;
			user.isAdmin = null;
			// rethrow so callers can handle/display error
			throw err;
		}
	}

	return {
		user,
		getUserDetails
	}
});