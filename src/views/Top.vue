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
          <v-text-field v-model="username" label="Username" prepend-icon="fas fa-user"/>
          <v-text-field v-model="password" :type="showPass ? 'text' : 'password'"
                        label="Password" prepend-icon="fas fa-lock"
                        :append-icon="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'"
                        @click:append="showPass = !showPass"/>
        </v-card-text>

        <v-card-actions>
          <v-spacer/>
          <v-btn :color="signup ? 'warning' : 'primary'" @click="signIn">
            {{ signup ? 'Sign Up' : 'Sign in'}}
          </v-btn>
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
      showPass: false,
      username: '',
      password: '',
    };
  },
  methods: {
    async signIn() {
      if (this.signup) {
        await this.$apollo.mutate({
          // eslint-disable-next-line
          mutation: require('../graphql/createAccount.gql'),
          variables: {
            username: this.username,
            password: this.password,
          },
        });
      }
      this.$http({
        method: 'POST',
        url: '/api/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: Object.entries({
          client_id: 'lovesync',
          client_secret: 'lovesync_secret',
          grant_type: 'password',
          username: this.username,
          password: this.password,
        })
          .reduce((p, e) => p.append(e[0], e[1]) || p, new URLSearchParams()),
      })
        .then(({ data }) => {
          window.sessionStorage.setItem('AccessToken', data.access_token);
          window.sessionStorage.setItem('RefreshToken', data.refresh_token);
          this.$nextTick(() => {
            this.$router.push('/home');
          });
        });
    },
  },
};
</script>

<style scoped lang="scss">
</style>
