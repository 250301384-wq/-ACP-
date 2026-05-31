import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.acp.bigdata.questionbank',
  appName: 'ACP大数据题库',
  webDir: 'web',
  server: {
    androidScheme: 'https',
  },
};

export default config;
