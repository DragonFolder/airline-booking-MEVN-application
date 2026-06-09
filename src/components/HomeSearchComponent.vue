<template>
	
	<div class="container py-4">
		<form @submit.prevent="handleSearch">

			<div class="mb-3 position-relative">
		      	<input
		            type="text"
		            v-model="departureCity"
		            @input="onDepartureInput"
		            @focus="onDepartureInput"
		            @blur="hideDeparture"
		            class="form-control"
		            placeholder="Departure City"
		            autocomplete="off"
		            required
		      	/>
		      	<ul v-if="departureSuggestions.length" class="dropdown-menu show w-100">
		            <li v-for="s in departureSuggestions" :key="s.code">
		                <button
		                    type="button"
		                    class="dropdown-item d-flex justify-content-between"
		                    @mousedown.prevent="selectDeparture(s)"
		                >
		                    <span>{{ s.city }}</span>
		                    <span class="text-muted">{{ s.code }}</span>
		                </button>
		            </li>
		      	</ul>
			</div>

			<div class="mb-3 position-relative">
			    <input
			        type="text"
			        v-model="arrivalCity"
			        @input="onArrivalInput"
			        @focus="onArrivalInput"
			        @blur="hideArrival"
			        class="form-control"
			        placeholder="Arrival City"
			        autocomplete="off"
			        required
			    />
			    <ul v-if="arrivalSuggestions.length" class="dropdown-menu show w-100">
			        <li v-for="s in arrivalSuggestions" :key="s.code">
			            <button
			                type="button"
			                class="dropdown-item d-flex justify-content-between"
			                @mousedown.prevent="selectArrival(s)"
			            >
			                <span>{{ s.city }}</span>
			                <span class="text-muted">{{ s.code }}</span>
			            </button>
			        </li>
			    </ul>
			</div>

			<div class="row g-2 mb-3">
				<div class="col-6">
					<input type="date" v-model="departureDate" class="form-control" required/>
				</div>
				<div class="col-6">
					<input type="number" v-model="passengerCount" class="form-control" placeholder="Passengers" required/>
				</div>
			</div>
			<div class="d-grid">
				<button class="btn btn-primary" type="submit" :disabled="isLoading">
					{{ isLoading ? "Searching..." : "Search" }}
				</button>
			</div>
		</form>
	</div>
</template>


<script setup>
	
	import { ref } from 'vue';
	import { Notyf } from 'notyf';
	import api from '../api.js';
	import { useRouter } from 'vue-router';

	const router = useRouter();

	const isLoading = ref(false);

	const departureCity = ref('');
	const arrivalCity = ref('');
	const departureCode = ref('');
  	const arrivalCode = ref('');
	const departureDate = ref('');
	const passengerCount = ref(1);

	const departureSuggestions = ref([]);
  	const arrivalSuggestions = ref([]);

  	function debounce(fn, wait = 300) {
        let t;
        return (...args) => {
                clearTimeout(t);
                t = setTimeout(() => fn(...args), wait);
        };
  	}

	async function fetchAirports(term, target) {
	    if (term.trim().length < 2) {
	        target.value = [];
	        return;
	    }
	    try {
	        const { data } = await api.get('/flights/airports', { params: { q: term } });
	        target.value = Array.isArray(data.data) ? data.data : [];
	    } catch (err) {
	        console.error('Airport lookup failed', err);
	        target.value = [];
	    }
	}

	const onDepartureInput = debounce(() => {
	    departureCode.value = '';            // invalidate code until a suggestion is picked
	    fetchAirports(departureCity.value, departureSuggestions);
	}, 300);

	const onArrivalInput = debounce(() => {
	    arrivalCode.value = '';
	    fetchAirports(arrivalCity.value, arrivalSuggestions);
	}, 300);

	function selectDeparture(s) {
	    departureCity.value = `${s.city} (${s.code})`;
	    departureCode.value = s.code;
	    departureSuggestions.value = [];
	}

	function selectArrival(s) {
	    arrivalCity.value = `${s.city} (${s.code})`;
	    arrivalCode.value = s.code;
	    arrivalSuggestions.value = [];
	}

	// small delay so a click on an option still registers before the list closes
	function hideDeparture() {
	    setTimeout(() => { departureSuggestions.value = []; }, 150);
	}

	function hideArrival() {
	    setTimeout(() => { arrivalSuggestions.value = []; }, 150);
	}

	const handleSearch = () => {
		isLoading.value = true;
		
		router.push({
			name: 'Flights',
			query: {
				from: departureCode.value || departureCity.value,
				to: arrivalCode.value || arrivalCity.value,
				date: departureDate.value,
				passengers: passengerCount.value
			}
		}).finally(() => {
			isLoading.value = false;
		})
	}

</script>