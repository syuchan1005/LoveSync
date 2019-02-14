<template>
  <div class="round-button elevation-3" v-ripple
       :style="{...$props, ...sizes}" @click="$emit('click')">
    <div><slot /></div>
  </div>
</template>

<script>
export default {
  props: {
    width: {
      type: [String, Number],
      default: '90%',
    },
    height: {
      type: [String, Number],
      default: '90%',
    },
    borderWidth: {
      type: String,
      default: '10px',
    },
    borderColor: {
      type: String,
      default: '#000',
    },
    borderStyle: {
      type: String,
      default: 'solid',
    },
    background: {
      type: String,
      default: '#616161',
    },
  },
  name: 'RoundButton',
  computed: {
    sizes() {
      let { width, height } = this.$props;
      if (typeof width === 'number') width = `${width}px`;
      if (typeof height === 'number') height = `${height}px`;
      return {
        width,
        height,
        minWidth: `${width}px`,
        minHeight: `${height}px`,
        maxWidth: `${width}px`,
        maxHeight: `${height}px`,
      };
    },
  },
};
</script>

<style scoped>
  .round-button {
    border-radius: 50%;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
