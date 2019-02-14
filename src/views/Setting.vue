<template>
  <div class="setting">
    <v-layout justify-center align-end>
      <v-avatar tile :size="avatarSize" color="grey lighten-4">
        <img src="https://vuetifyjs.com/apple-touch-icon-180x180.png" alt="avatar">
      </v-avatar>
      <v-btn outline color="secondary" style="margin-left: 24px">
        <v-icon left>fas fa-upload</v-icon>Upload
      </v-btn>
    </v-layout>

    <v-text-field label="Username" :value="user.username" readonly/>

    <v-list>
      <v-subheader>
        Paired
      </v-subheader>
      <v-list-tile avatar>
        <v-list-tile-avatar>
          <img src="https://vuetifyjs.com/apple-touch-icon-180x180.png" alt="avatar">
        </v-list-tile-avatar>

        <v-list-tile-content>
          <v-list-tile-title>Username</v-list-tile-title>
          <v-list-tile-sub-title>by 2019/02/14 14:20</v-list-tile-sub-title>
        </v-list-tile-content>

        <v-list-tile-action>
          <v-btn fab small flat><v-icon>fas fa-trash</v-icon></v-btn>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>

    <v-btn color="error" block outline>Delete Account</v-btn>
  </div>
</template>

<script>
export default {
  apollo: {
    // eslint-disable-next-line
    user: require('../graphql/user.gql'),
  },
  name: 'Setting',
  computed: {
    avatarSize() {
      return this.$vuetify.clientWidth / 2.5;
    },
  },
};
</script>

<style scoped lang="scss">
  .setting {
    margin: 16px;

    & > * {
      margin-bottom: 16px;
    }
  }
</style>
