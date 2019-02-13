<template>
  <v-app>
    <v-toolbar app v-if="$route.path !== '/'">
      <v-toolbar-title class="headline text-uppercase">
        <span>LoveSync</span>
      </v-toolbar-title>
    </v-toolbar>

    <v-content>
      <router-view/>
    </v-content>
  </v-app>
</template>

<script>

export default {
  name: 'App',
};
</script>
