<template>
  <v-app>
    <v-toolbar app v-if="$route.path !== '/'"
               :class="{appHeader:$route.path !== '/'}" color="pink accent-2">
      <v-toolbar-title class="headline">LoveSync</v-toolbar-title>
      <v-spacer/>
      <v-btn depressed @click="signOut">
        <v-icon left>fas fa-sign-out-alt</v-icon>
        Sign Out
      </v-btn>
    </v-toolbar>

    <v-content :class="{appContent:$route.path !== '/'}">
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
                  @update:active="(p) => { if ($route.path !== '/') $router.push(p) }"
                  :class="{appFooter:$route.path !== '/'}">
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
  apollo: {
    $subscribe: {
      push: {
        // eslint-disable-next-line
        query: require('./graphql/pushSubscription.gql'),
        result() {
          this.$store.commit('setColor', 2);
        },
      },
    },
  },
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
      this.$store.commit('setToken', {});
      this.$router.push('/');
    },
  },
};
</script>

<style scoped>
  .appHeader {
    padding-top: env(safe-area-inset-top);
  }

  .appContent {
    margin-top: env(safe-area-inset-top);
    margin-bottom: env(safe-area-inset-bottom);
  }

  .appFooter {
    height: auto !important;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .overlay {
    z-index: 999999;
    background: rgba(0, 0, 0, 0.2);
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }
</style>
