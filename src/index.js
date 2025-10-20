import app from "./server.js";

const PORT = 4000;

app.listen(PORT, () => {
	console.log(`🚀 Server running at http://localhost:${PORT}/graphql`);
});
