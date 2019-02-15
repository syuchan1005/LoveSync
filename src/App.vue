<template>
  <v-app>
    <v-toolbar app v-if="$route.path !== '/'">
      <v-toolbar-title class="headline">LoveSync</v-toolbar-title>
      <v-spacer />
      <v-btn color="primary" outline @click="signOut">
        <v-icon left>fas fa-sign-out-alt</v-icon>Sign Out
      </v-btn>
    </v-toolbar>

    <v-content>
      <router-view/>

      <v-snackbar v-model="showReloadAlert"
                  auto-height bottom :timeout="0" color="success">
        Update Available! Please Reload.
        <v-btn color="warning" @click="locationReload(true)">
          Reload
        </v-btn>
      </v-snackbar>
    </v-content>

    <v-bottom-nav app fixed :value="$route.path !== '/'" :active="$route.path"
                  @update:active="(p) => { if ($route.path !== '/') $router.push(p) }">
      <v-btn color="blue" flat value="/home">
        <span>Home</span>
        <v-icon>fas fa-home</v-icon>
      </v-btn>
      <v-btn color="green" flat value="/setting">
        <span>Setting</span>
        <v-icon>fas fa-cogs</v-icon>
      </v-btn>
    </v-bottom-nav>
  </v-app>
</template>

<script>

export default {
  name: 'App',
  data() {
    return {
      showReloadAlert: false,
    };
  },
  mounted() {
    if (window.isUpdateAvailable) {
      window.isUpdateAvailable.then((available) => {
        this.showReloadAlert = available;
      });
    }
  },
  methods: {
    locationReload: val => window.location.reload(val),
    signOut() {
      this.$router.push('/');
    },
  },
};
</script>
