<template>
  <v-layout fill-height align-center justify-center>
    <v-flex xs12 sm8 md4>
      <v-card class="card">
        <v-toolbar>
          <v-btn icon v-if="signup" @click="signup = false">
            <v-icon>fas fa-angle-left</v-icon>
          </v-btn>
          <v-toolbar-title class="headline">LoveSync</v-toolbar-title>
        </v-toolbar>

        <v-card-text>
          <v-text-field label="Username" prepend-icon="fas fa-user"/>
          <v-text-field type="password" clearable label="Password" prepend-icon="fas fa-lock"/>
        </v-card-text>

        <v-card-actions>
          <v-spacer/>
          <v-btn :color="signup ? 'warning' : 'primary'">{{ signup ? 'Sign Up' : 'Sign in'}}</v-btn>
          <v-spacer/>
        </v-card-actions>

        <v-card-actions v-if="!signup">
          <v-spacer/>
          <v-btn color="warning" outline @click="signup = true">Have no account?</v-btn>
          <v-spacer/>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'Top',
  data() {
    return {
      signup: false,
    };
  },
};
</script>

<style scoped lang="scss">
  .card {

  }
</style>
