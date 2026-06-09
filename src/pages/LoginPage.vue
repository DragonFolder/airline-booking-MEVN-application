<script setup>
    /* ACTIVITY SOLUTION START */
    import { watch, ref, onBeforeMount } from 'vue';
    import { useGlobalStore } from '../stores/global';
    import { Notyf } from 'notyf';

    // import axios from 'axios';
    import api from '../api';

    //import global store, which contains our global states
    const { getUserDetails, user } = useGlobalStore();
    /* ACTIVITY SOLUTION END */

    //import useRouter from vue-router to import our router and be able to access it's redirecting methods instead of changing the page via href to force a page to refresh
    import { useRouter } from 'vue-router';

    //page navigation
    const router = useRouter();

    const email = ref("");
    const password = ref("");
    const isEnabled = ref(false);

    const notyf = new Notyf();

    watch([email,password], (currentValue, oldValue) => {

        if(currentValue.every(input => input !== "")){
            isEnabled.value = true
        } else {
            isEnabled.value = false
        }
    });

    async function handleSubmit(e){
        e.preventDefault();

        try {


            let res = await api.post('/auth/login', {

                email: email.value,
                password: password.value
            })
            const token = res.data?.data?.access;
            if(token) {
                // persist token first so api interceptor and global store can use it
                localStorage.setItem("token", token);

                try {
                    await getUserDetails(token);
                } catch (err) {
                    // cleanup and show error if profile fetch fails
                    localStorage.removeItem('token');
                    const msg = err.response?.data?.message || 'Failed to retrieve user profile.';
                    notyf.error(msg);
                    return;
                }

                notyf.success("Login Successful");

                email.value = "";
                password.value = "";

                // redirect to home
                router.push({ name: 'Home' });

            }

        } catch(e) {
            const msg = e.response?.data?.message || e.response?.data || 'Login Failed. Please contact admin.';
            const status = e.response?.status;
            if(status === 404 || status === 401 || status === 400) {
                notyf.error(msg)
            } else {
                notyf.error("Login Failed. Please contact admin.");
            }
        }
        
    }

     /* ACTIVITY SOLUTION START */
    onBeforeMount(()=>{
        if(user.email){
            router.push({ name: 'Home' })
        }
    })
    /* ACTIVITY SOLUTION END */
</script>

<template>
    <div class="hero-container">
    <div class="container-fluid">
        <h1 class="my-5 pt-3 text-center hero-title">Login Page</h1> 
        <div class="row d-flex justify-content-center">
            <div class="col-md-5 bg-white border rounded-3 mx-auto p-5">
                <form v-on:submit="handleSubmit">
                    <div class="mb-3">
                        <label for="emailInput" class="form-label">Email Address</label>
                        <input type="email" class="form-control" id="emailInput" v-model="email" />
                        <span v-if="email === ''" class="text-danger small">Email is required.</span>
                    </div>
                    <div class="mb-3">
                        <label for="passwordInput" class="form-label">Password</label>
                        <input type="password" class="form-control" id="passwordInput" v-model="password" />
                        <span v-if="password === ''" class="text-danger small">Password is required.</span>
                    </div>
                    <div class="d-grid mt-5">
                        <button type="submit" class="btn btn-primary btn-block"  v-if="isEnabled">Login</button>
                        <button type="submit" class="btn btn-danger btn-block" disabled v-else>Login</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
</template>
