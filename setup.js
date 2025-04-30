import pg from "pg";

import { PostgresSaver } from "./dist/index.js";

const { Pool } = pg;

const connectionString = `postgresql://wabot:wabot@localhost:3024/wabot`;
const pool = new Pool({
	connectionString,
});

const checkpointer = new PostgresSaver(pool);

(async () => {
	await checkpointer.setup();
})();
