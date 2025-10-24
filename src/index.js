import app from "./server.js";
import config from "./config/env.js";

const PORT = config.PORT;

// Start server
const server = app.listen(PORT, () => {
	console.log(`🚀 Server running at http://localhost:${PORT}/graphql`);
	console.log(`📊 Health check: http://localhost:${PORT}/health`);
	console.log(`🌍 Environment: ${config.NODE_ENV}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("SIGTERM received, shutting down gracefully");
	server.close(() => {
		console.log("Process terminated");
		process.exit(0);
	});
});

process.on("SIGINT", () => {
	console.log("SIGINT received, shutting down gracefully");
	server.close(() => {
		console.log("Process terminated");
		process.exit(0);
	});
});
