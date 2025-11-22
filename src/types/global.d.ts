namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production';
  }
}

const process: {
  env: NodeJS.ProcessEnv;
};
