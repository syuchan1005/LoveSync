<template>
  <div class="home">
    <round-button :width="buttonSize" :height="buttonSize"
                  :border-color="colors[colorNum]" @click="clickPush">
      <span class="display-1 white--text">Excited?</span>
    </round-button>

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
  title: 'Home',
  name: 'Home',
  data() {
    return {
      colorNum: 0,
      colors: ['#B0BEC5', '#E91E63', '#8BC34A'],
      errorText: '',
      showError: false,
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
        this.colorNum = data.push[0].success ? 2 : 1;
      }).catch((e) => {
        this.errorText = e.graphQLErrors[0].message;
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
