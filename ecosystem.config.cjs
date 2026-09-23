module.exports = {
  apps: [
    {
      name: 'finance-tracker',
      script: 'npm',
      args: 'start',
      cwd: '/mnt/c/Users/ALX/Documents/Project/finance-tracker-todo-list-nextjs',

      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      time: true,
    },
  ],
}
