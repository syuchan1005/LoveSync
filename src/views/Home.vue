<template>
  <div class="home">
    <round-button :width="buttonSize" :height="buttonSize"
                  :border-color="colors[$store.state.color]" @click="clickPush">
      <span class="display-1 white--text">Excited?</span>
    </round-button>

    <v-card style="position: absolute; bottom: 10px">
      <v-card-text>
        User: {{ username }}
      </v-card-text>
    </v-card>

    <v-snackbar v-model="showError" absolute auto-height bottom :timeout="1500">
      {{ errorText }}
      <v-btn color="pink" flat @click="showError = false">
        Close
      </v-btn>
    </v-snackbar>
  </div>
</template>

<script>
import RoundButton from '../components/RoundButton.vue';

export default {
  components: { RoundButton },
  apollo: {
    pushes: {
      // eslint-disable-next-line
      query: require('../graphql/pushesQuery.gql'),
      manual: true,
      result({ data: { user } }) {
        this.$store.commit('setColor', (user.pushes || []).length === 0 ? 0 : 2);
        this.username = user.username;
      },
    },
  },
  title: 'Home',
  name: 'Home',
  data() {
    return {
      colors: ['#B0BEC5', '#E91E63', '#8BC34A'],
      errorText: '',
      showError: false,
      username: '',
    };
  },
  computed: {
    buttonSize() {
      return Math.min(this.$vuetify.clientWidth * 0.8, this.$vuetify.clientHeight * 0.8, 480);
    },
  },
  methods: {
    clickPush() {
      this.$apollo.mutate({
        // eslint-disable-next-line
        mutation: require('../graphql/push.gql'),
      }).then(({ data }) => {
        this.$store.commit('setColor', data.push[0].success ? 2 : 1);
      }).catch(({ graphQLErrors, networkError }) => {
        if (graphQLErrors) this.errorText = graphQLErrors[0].message;
        else this.errorText = networkError;
        this.showError = true;
      });
    },
  },
};
</script>

<style scoped>
  .home {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
