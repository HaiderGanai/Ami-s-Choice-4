const logger = (req, res, next) => {
    const start = Date.now();

    // Intercept res.finish to log after response is sent
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        // Color-code by status
        const color =
            statusCode >= 500 ? '\x1b[31m' : // red
            statusCode >= 400 ? '\x1b[33m' : // yellow
            statusCode >= 200 ? '\x1b[32m' : // green
            '\x1b[0m';

        const reset = '\x1b[0m';
        const dim = '\x1b[2m';

        console.log(
            `${dim}[REQUEST]${reset} ` +
            `\x1b[36m${req.method}${reset} ` +
            `${req.originalUrl} ` +
            `${color}${statusCode}${reset} ` +
            `${dim}— ${duration}ms${reset}`
        );
    });

    next();
};

module.exports = logger;