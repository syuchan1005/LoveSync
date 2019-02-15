<template>
  <div class="setting">
    <!--<v-layout justify-center align-end>
      <v-avatar tile :size="avatarSize" color="grey lighten-4">
        <img src="https://vuetifyjs.com/apple-touch-icon-180x180.png" alt="avatar">
      </v-avatar>
      <v-btn outline color="secondary" style="margin-left: 24px">
        <v-icon left>fas fa-upload</v-icon>Upload
      </v-btn>
    </v-layout>-->

    <v-text-field label="Username" :value="user.username" readonly />

    <v-list v-if="user.pair">
      <v-subheader>
        Pair
      </v-subheader>
      <v-list-tile avatar>
        <!--<v-list-tile-avatar>
          <img src="https://vuetifyjs.com/apple-touch-icon-180x180.png" alt="avatar">
        </v-list-tile-avatar>-->

        <v-list-tile-content>
          <v-list-tile-title>Username</v-list-tile-title>
          <v-list-tile-sub-title>by 2019/02/14 14:20</v-list-tile-sub-title>
        </v-list-tile-content>

        <v-list-tile-action>
          <v-btn fab small flat><v-icon>fas fa-trash</v-icon></v-btn>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>
    <v-card v-else>
      <v-layout v-if="pair === ''"
        column justify-center align-center>
        <div class="headline">Pairing</div>
        <!--<v-btn large outline @click="pair = 'read'">
          <v-icon left>fas fa-camera</v-icon>Read QR Code
        </v-btn>-->
        <v-btn large outline @click="showQRCode">
          <v-icon left>fas fa-qrcode</v-icon>Show Code
        </v-btn>
        <v-layout align-center justify-space-between>
          <v-text-field v-model="pairCode" label="code"
                        append-icon="fas fa-camera" @click:append="pair = 'read'" />
          <v-btn color="secondary" @click="checkCode">pair</v-btn>
        </v-layout>
      </v-layout>
      <v-layout v-else-if="pair === 'show'"
                fill-height column justify-center align-center>
        <qrcode :value="pairCode" :options="{ width: Math.min($vuetify.clientWidth * 0.8, 250) }"/>
        <v-text-field v-model="pairCode" label="code" readonly
                      append-outer-icon="fas fa-clipboard"
                      @click:append-outer="copyClipBoard(pairCode)" />
        <v-btn outline @click="backShowQRCode">
          <v-icon left>fas fa-angle-left</v-icon>back
        </v-btn>
      </v-layout>
      <v-layout v-else-if="pair === 'read'"
                fill-height column justify-center align-center>
        <qrcode-stream :track="false" @decode="(res) => { this.pairCode = res; this.pair = ''; }" />
        <v-btn outline @click="pair = ''">
          <v-icon left>fas fa-angle-left</v-icon>back
        </v-btn>
      </v-layout>
    </v-card>

    <v-btn color="error" block outline @click="deleteAccount">
      Delete Account
    </v-btn>
  </div>
</template>

<script>
import Qrcode from '@chenfengyuan/vue-qrcode';
import { QrcodeStream } from 'vue-qrcode-reader';

export default {
  components: {
    Qrcode,
    QrcodeStream,
  },
  apollo: {
    user: {
      // eslint-disable-next-line
      query: require('../graphql/user.gql'),
    },
  },
  name: 'Setting',
  data() {
    return {
      pair: '',
      pairCode: '',
    };
  },
  computed: {
    avatarSize() {
      return this.$vuetify.clientWidth / 2.5;
    },
  },
  methods: {
    checkCode() {
      this.$apollo.mutate({
        // eslint-disable-next-line
        mutation: require('../graphql/acceptPairCode.gql'),
        variables: {
          code: this.pairCode,
        },
      }).then(() => {
        this.$apollo.queries.user.refresh();
      });
    },
    showQRCode() {
      this.$apollo.mutate({
        // eslint-disable-next-line
        mutation: require('../graphql/generatePairCode.gql'),
      }).then(({ data }) => {
        this.pairCode = data.generatePairCode.code;
        this.pair = 'show';
      });
    },
    backShowQRCode() {
      this.$apollo.mutate({
        // eslint-disable-next-line
        mutation: require('../graphql/revokePairCode.gql'),
        variables: {
          code: this.pairCode,
        },
      }).then(() => {
        this.pairCode = '';
        this.pair = '';
      });
    },
    copyClipBoard(text) {
      const e = document.createElement('input');
      e.value = text;
      document.body.appendChild(e);
      e.select();
      document.execCommand('copy');
      document.body.removeChild(e);
    },
    async deleteAccount() {
      await this.$apollo.mutate({
        // eslint-disable-next-line
        mutation: require('../graphql/deleteAccount.gql'),
      });
      this.$router.push('/');
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
