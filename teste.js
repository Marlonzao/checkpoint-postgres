import pg from 'pg';

import { PostgresSaver } from './index.js';

const { Pool } = pg;

const connectionString = `postgresql://wabot:wabot@localhost:3024/wabot`;
const pool = new Pool({
  connectionString,
});

const checkpointer = new PostgresSaver(pool);

(async () => {

	// const config = {
	// 	configurable: {
	// 	  thread_id: 1,
	// 	  checkpoint_ns: "test-ns",
	// 	  checkpoint_id: "original-checkpoint-id"
	// 	}
	//   };
	
	//   const checkpoint = {
	// 	id: "new-checkpoint-id",
	// 	channel_values: {
	// 	  foo: { value: "bar" },
	// 	}
	//   };
	
	//   const metadata = {
	// 	created_by: "manual-test",
	// 	timestamp: new Date().toISOString()
	//   };
	
	//   const newVersions = {
	// 	foo: { version: "v2" }
	//   };
	
	//   try {
	// 	const result = await checkpointer.put(config, checkpoint, metadata, newVersions);
	// 	console.log("Next config returned:", result);
	//   } catch (error) {
	// 	console.error("Error during put:", error);
	//   } finally {
	// 	await pool.end();
	//   }

	const config = {
		configurable: {
		  thread_id: 1,
		  checkpoint_ns: "test-ns",
		  checkpoint_id: "some-checkpoint-id",
		}
	  };
	
	  // Exemplo de PendingWrite: [writeType, data]
	  // Ex: ["input", { text: "Hello" }]
	  const writes = [
		["input", { text: "Oi, mundo!" }],
		["output", { text: "Resposta gerada" }],
	  ];
	
	  const taskId = "task-abc-123";
	
	  try {
		await checkpointer.putWrites(config, writes, taskId);
		console.log("putWrites executado com sucesso.");
	  } catch (error) {
		console.error("Erro ao executar putWrites:", error);
	  } finally {
		await pool.end();
	  }

})();
