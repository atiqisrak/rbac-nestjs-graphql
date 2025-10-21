module.exports = {
    apps: [
        {
            name: 'rbac-service',
            script: 'dist/src/main.js',
            instances: 2,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            autorestart: true,
            max_memory_restart: '1G',
            restart_delay: 4000,
        },
    ],
};

