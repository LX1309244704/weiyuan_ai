module.exports = {
  apps: [{
    name: 'weiyuan-api',
    script: 'src/index.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1.5G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    time: true
  }]
};
