<script setup>
	 /* ACTIVITY SOLUTION START */
	import { watch, ref, onBeforeMount } from 'vue';

	import { Notyf } from 'notyf';
	import { useRouter } from 'vue-router';
    import { useGlobalStore } from '../stores/global.js';
	/* ACTIVITY SOLUTION END */
	import api from '../api.js';

	/*
	When the input value is updated so will the reactive state it is bound, vice versa
	*/
	const fullName = ref("");
	const mobileNum = ref("");
	const email = ref("");
	const password = ref("");
	const confirmPassword = ref("");
	const isEnabled = ref(false);

	const notyf = new Notyf();

	/* ACTIVITY SOLUTION START */
    const router = useRouter()

    const { user } = useGlobalStore();
    /* ACTIVITY SOLUTION END */

	watch([email, password, confirmPassword, fullName, mobileNum], (currentValue, oldValue) => {
		// console.log(currentValue);

		if(currentValue.every(input => input !== "") && currentValue[1] === currentValue[2]) {
			isEnabled.value = true
		} else {
			isEnabled.value = false
		}
	});

	async function handleSubmit(e) {
		e.preventDefault();

		// console.log(email.value);
		// console.log(password.value);
		// console.log(confirmPassword.value);

		try {

				// register via /auth/register (backend auth routes)
				let response = await api.post('/auth/register', {
					full_name: fullName.value,
					email: email.value,
					password: password.value,
					mobileNo: mobileNum.value
				})

			if(response.status === 201) {
				notyf.success('Account created. Please log in.');

				fullName.value = "";
				mobileNum.value = "";
				email.value = "";
				password.value = "";
				confirmPassword.value = "";

				router.push({ path: '/login'})

			} else {
				notyf.error("Registration Failed. Please contact admin.");
			}

		} catch(e) {

				const msg = e.response?.data?.message || e.response?.data || 'Registration Failed. Please contact admin.';
				if( e.response.status === 404 || e.response.status === 401 || e.response.status === 400 || e.response.status === 409) {

					notyf.error(msg);

				} else {

					console.error(e);
					notyf.error("Registration Failed. Please contact admin.")
				}
		}
		
	}

	/* ACTIVITY SOLUTION START */
    onBeforeMount(() => {
        if(user.email){
            router.push({path: '/landing'})
        }
    })
    /* ACTIVITY SOLUTION END */

</script>

<template>
	<div class="hero-container">
	<div class="container-fluid">
		<h1 class="my-5 pt-3 text-center hero-title">
			Register Page
		</h1>
		<div class="row d-flex justify-content-center">
			<div class="col-md-5 bg-white border rounded-3 mx-auto p-5">
			<form v-on:submit="handleSubmit">
				<div class="mb-3">
					<label for="fName" class="form-label">FullName</label>
					<input type="text" class="form-control" id="fName" v-model="fullName">
				</div>
				
				<div class="mb-3">
					<label for="mobile" class="form-label">Mobile Number</label>
					<input type="text" class="form-control" id="mobile" v-model="mobileNum">
				</div>
				<div class="mb-3">
					<label for="emailInput" class="form-label">
						Email Address
					</label>
					 <!-- v-bind:value = allows us to bind the value of this input to an exposed variable -->
                        <!-- v-on:input is an event listener directive that allow us to run a given function as the user types in an input. -->
                        <!-- 
                            $event - is the event object which contains information about "what happened" in the element. This event object can be passed into the event listener function for processing.

                            $event.target - is the element where the event happened.
                            $event.target.value - the value of the element where the event happened.

                            email = $event.target.value - update the value of the email state with the current value of the element.
                        -->
					<input type="email" class="form-control" id="emailInput" v-model="email">
				</div>
				 <!-- v-model is a directive which also allows for binding the value of an element to an exposed variable. However, v-model also automatically adds the current value of the element into the reactive state upon user input-->
				<div class="mb-3">
					<label for="passwordInput" class="form-label">
						Password
					</label>
					<input type="password" class="form-control" id="passwordInput" v-model="password">
				</div>

				<div class="mb-3">
					<label for="cpasswordInput" class="form-label">
						Confirm Password
					</label>
					<input type="password" class="form-control" id="cpasswordInput" v-model="confirmPassword">
				</div>

				<div class="d-grid mt-5">
					<button type="submit" class="btn btn-primary btn-block" v-if="isEnabled">Submit</button>
					<button type="submit" class="btn btn-danger btn-block" disabled v-else>Submit</button>
				</div>
			</form>
			</div>
		</div>
	</div>
	</div>
</template>
