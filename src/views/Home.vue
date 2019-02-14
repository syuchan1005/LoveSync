<template>
  <div class="home">
    <round-button :width="buttonSize" :height="buttonSize"
                  :border-color="colors[a % colors.length]" @click="a++">
      <span class="display-1 white--text">Excited?</span>
    </round-button>
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
      a: 0,
      colors: ['#B0BEC5', '#E91E63', '#8BC34A'],
    };
  },
  computed: {
    buttonSize() {
      return Math.min(this.$vuetify.clientWidth * 0.8, this.$vuetify.clientHeight * 0.8, 480);
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
